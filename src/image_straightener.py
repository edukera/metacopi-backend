#!/usr/bin/env python3
import cv2
import numpy as np
import os
import logging
import argparse
from datetime import datetime
import math

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('ImageStraightener')

class ImageStraightener:
    """
    Classe spécialisée dans la détection et le redressement automatique
    d'images de copies d'élèves avec diverses méthodes de détection d'angle.
    """
    
    def __init__(self, input_image_path, method='hough', max_angle=30, output_dir=None, show_lines=False):
        """
        Initialise le redresseur d'image avec le chemin de l'image d'entrée et les options.
        
        Args:
            input_image_path (str): Chemin de l'image à redresser
            method (str): Méthode de détection d'angle ('hough', 'contour', 'mser')
            max_angle (int): Angle maximum de rotation en degrés (limite les corrections excessives)
            output_dir (str, optional): Répertoire de sortie personnalisé
            show_lines (bool): Afficher les lignes détectées sur l'image résultat
        """
        self.input_image_path = input_image_path
        self.method = method
        self.max_angle = max_angle
        self.output_dir = output_dir or 'assets/processed'
        self.show_lines = show_lines
        
        # Créer le dossier de sortie s'il n'existe pas
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
    def detect_angle_hough(self, image):
        """Détecte l'angle d'inclinaison en utilisant la transformée de Hough."""
        # Conversion en niveaux de gris si nécessaire
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Augmenter le contraste pour mieux détecter les lignes
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)
        
        # Réduction du bruit
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Appliquer l'algorithme de Canny pour la détection de contours
        edges = cv2.Canny(blurred, 50, 150, apertureSize=3)
        
        # Trouver les lignes avec la transformée de Hough
        lines = cv2.HoughLines(edges, 1, np.pi/180, 200)
        
        if lines is None or len(lines) == 0:
            logger.info("Aucune ligne détectée avec la méthode de Hough.")
            return 0, None
        
        # Identifier les lignes principales (horizontales ou verticales)
        horizontal_lines = []
        vertical_lines = []
        
        for line in lines:
            rho, theta = line[0]
            # Lignes horizontales (proche de 0 ou pi)
            if (theta < np.pi/4) or (theta > 3*np.pi/4):
                horizontal_lines.append(line)
            # Lignes verticales (proche de pi/2)
            elif (np.pi/4 <= theta <= 3*np.pi/4):
                vertical_lines.append(line)
        
        # Priorité aux lignes horizontales (généralement plus fiables pour l'angle)
        selected_lines = horizontal_lines if horizontal_lines else vertical_lines
        
        if not selected_lines:
            logger.info("Aucune ligne principale détectée.")
            return 0, None
        
        # Calculer l'angle moyen
        angles = []
        for line in selected_lines:
            rho, theta = line[0]
            
            # Convertir l'angle selon si c'est une ligne horizontale ou verticale
            if (theta < np.pi/4) or (theta > 3*np.pi/4):  # horizontale
                angle_degrees = np.degrees(theta) if theta < np.pi/4 else np.degrees(theta - np.pi)
            else:  # verticale
                angle_degrees = np.degrees(theta - np.pi/2)
            
            angles.append(angle_degrees)
        
        # Éliminer les valeurs aberrantes (angles très différents des autres)
        if len(angles) > 3:
            angles = sorted(angles)
            q1 = np.percentile(angles, 25)
            q3 = np.percentile(angles, 75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            filtered_angles = [a for a in angles if lower_bound <= a <= upper_bound]
            if filtered_angles:
                angles = filtered_angles
        
        angle_degrees = np.mean(angles)
        
        # Limiter l'angle maximum de correction
        if abs(angle_degrees) > self.max_angle:
            angle_degrees = self.max_angle if angle_degrees > 0 else -self.max_angle
            logger.info(f"Angle limité à {angle_degrees} degrés (max_angle={self.max_angle})")
        
        return angle_degrees, selected_lines
    
    def detect_angle_contour(self, image):
        """Détecte l'angle d'inclinaison en utilisant la boîte englobante des contours."""
        # Conversion en niveaux de gris
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Binarisation pour isoler le contenu
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # Trouver les contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            logger.info("Aucun contour détecté.")
            return 0, None
        
        # Filtrer les petits contours (bruit)
        min_area = image.shape[0] * image.shape[1] * 0.001  # 0.1% de l'image
        filtered_contours = [c for c in contours if cv2.contourArea(c) > min_area]
        
        if not filtered_contours:
            logger.info("Aucun contour significatif détecté.")
            return 0, None
        
        # Trouver la boîte englobante orientée pour chaque contour principal
        angles = []
        rect_boxes = []
        
        for contour in filtered_contours:
            rect = cv2.minAreaRect(contour)
            box = cv2.boxPoints(rect)
            box = np.int32(box)
            rect_boxes.append(box)
            
            # Calculer l'angle de la boîte
            width, height = rect[1]
            if width < height:
                angle = 90 + rect[2]
            else:
                angle = rect[2]
            
            angles.append(angle)
        
        # Calculer l'angle moyen
        angle_degrees = np.mean(angles)
        
        # Limiter l'angle maximum de correction
        if abs(angle_degrees) > self.max_angle:
            angle_degrees = self.max_angle if angle_degrees > 0 else -self.max_angle
            logger.info(f"Angle limité à {angle_degrees} degrés (max_angle={self.max_angle})")
        
        return angle_degrees, rect_boxes
    
    def detect_angle_mser(self, image):
        """Détecte l'angle d'inclinaison en utilisant les régions MSER (texte)."""
        # Conversion en niveaux de gris
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Détection des régions MSER (fonctionne bien pour le texte)
        mser = cv2.MSER_create()
        regions, _ = mser.detectRegions(gray)
        
        if not regions:
            logger.info("Aucune région MSER détectée.")
            return 0, None
        
        # Convertir les régions en boîtes englobantes
        boxes = []
        for region in regions:
            x, y, w, h = cv2.boundingRect(region.reshape(-1, 1, 2))
            if w > 5 and h > 5 and w < gray.shape[1] / 3 and h < gray.shape[0] / 3:
                boxes.append((x, y, w, h))
        
        if not boxes:
            logger.info("Aucune boîte englobante significative.")
            return 0, None
        
        # Regrouper les boîtes par lignes (texte)
        # Trier par coordonnée y
        boxes.sort(key=lambda b: b[1])
        
        # Regrouper les boîtes qui sont sur la même ligne
        line_height = np.median([b[3] for b in boxes])
        lines = []
        current_line = [boxes[0]]
        
        for i in range(1, len(boxes)):
            if abs(boxes[i][1] - boxes[i-1][1]) < line_height * 0.7:
                current_line.append(boxes[i])
            else:
                if len(current_line) > 2:  # Au moins 3 éléments pour former une ligne
                    lines.append(current_line)
                current_line = [boxes[i]]
        
        if len(current_line) > 2:
            lines.append(current_line)
        
        if not lines:
            logger.info("Aucune ligne de texte détectée.")
            return 0, None
        
        # Calculer les angles des lignes de texte
        angles = []
        line_boxes = []
        
        for line in lines:
            if len(line) < 3:
                continue
                
            # Calculer la régression linéaire pour cette ligne
            x_points = [b[0] + b[2]/2 for b in line]
            y_points = [b[1] + b[3]/2 for b in line]
            
            if len(x_points) < 3:
                continue
                
            # Calcul de la pente par régression linéaire
            coeffs = np.polyfit(x_points, y_points, 1)
            slope = coeffs[0]
            
            # Convertir la pente en angle
            angle_degrees = np.degrees(np.arctan(slope))
            angles.append(angle_degrees)
            
            # Créer une boîte pour visualisation
            left_x = min(x_points)
            right_x = max(x_points)
            left_y = int(slope * left_x + coeffs[1])
            right_y = int(slope * right_x + coeffs[1])
            
            line_boxes.append(np.array([[left_x, left_y], [right_x, right_y]]))
        
        if not angles:
            logger.info("Impossible de calculer l'angle des lignes de texte.")
            return 0, None
        
        # Calculer l'angle moyen
        angle_degrees = np.mean(angles)
        
        # Limiter l'angle maximum de correction
        if abs(angle_degrees) > self.max_angle:
            angle_degrees = self.max_angle if angle_degrees > 0 else -self.max_angle
            logger.info(f"Angle limité à {angle_degrees} degrés (max_angle={self.max_angle})")
        
        return angle_degrees, line_boxes
    
    def rotate_image(self, image, angle_degrees):
        """Applique une rotation à l'image selon l'angle détecté."""
        if abs(angle_degrees) < 0.1:
            logger.info("Angle négligeable, aucune rotation nécessaire.")
            return image
        
        # Centre de rotation au milieu de l'image
        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        
        # Matrice de rotation
        M = cv2.getRotationMatrix2D(center, angle_degrees, 1.0)
        
        # Rotation de l'image
        rotated = cv2.warpAffine(
            image, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        
        return rotated
    
    def enhance_and_straighten(self):
        """Détecte l'angle d'inclinaison et redresse l'image."""
        try:
            # Lire l'image
            logger.info(f"Lecture de l'image: {self.input_image_path}")
            image = cv2.imread(self.input_image_path)
            
            if image is None:
                raise Exception(f"Impossible de lire l'image: {self.input_image_path}")
            
            # Créer une copie pour la visualisation
            visualization = image.copy()
            
            # Détection de l'angle selon la méthode choisie
            logger.info(f"Détection de l'angle avec la méthode: {self.method}")
            
            if self.method == 'contour':
                angle_degrees, detected_elements = self.detect_angle_contour(image)
            elif self.method == 'mser':
                angle_degrees, detected_elements = self.detect_angle_mser(image)
            else:  # méthode 'hough' par défaut
                angle_degrees, detected_elements = self.detect_angle_hough(image)
            
            # Affichage des lignes détectées si demandé
            if self.show_lines and detected_elements is not None:
                if self.method == 'hough':
                    # Dessiner les lignes de Hough
                    for line in detected_elements:
                        rho, theta = line[0]
                        a = np.cos(theta)
                        b = np.sin(theta)
                        x0 = a * rho
                        y0 = b * rho
                        x1 = int(x0 + 1000 * (-b))
                        y1 = int(y0 + 1000 * (a))
                        x2 = int(x0 - 1000 * (-b))
                        y2 = int(y0 - 1000 * (a))
                        cv2.line(visualization, (x1, y1), (x2, y2), (0, 0, 255), 2)
                
                elif self.method == 'contour':
                    # Dessiner les boîtes englobantes
                    for box in detected_elements:
                        cv2.drawContours(visualization, [box], 0, (0, 255, 0), 2)
                
                elif self.method == 'mser':
                    # Dessiner les lignes de texte
                    for line in detected_elements:
                        cv2.line(visualization, tuple(map(int, line[0])), tuple(map(int, line[1])), (255, 0, 0), 2)
            
            # Log de l'angle détecté
            logger.info(f"Angle détecté: {angle_degrees:.2f} degrés")
            
            # Rotation de l'image
            rotated = self.rotate_image(image, angle_degrees)
            
            # Rotation de la visualisation si demandée
            if self.show_lines:
                visualization_rotated = self.rotate_image(visualization, angle_degrees)
            
            # Générer des noms de fichier uniques pour la sortie
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            base_name = os.path.basename(self.input_image_path)
            name, ext = os.path.splitext(base_name)
            
            # Chemin pour l'image redressée
            output_path = os.path.join(
                self.output_dir, 
                f"{name}_straightened_{self.method}_{timestamp}{ext}"
            )
            
            # Enregistrer l'image redressée
            logger.info(f"Enregistrement de l'image redressée dans: {output_path}")
            cv2.imwrite(output_path, rotated)
            
            # Enregistrer la visualisation si demandée
            if self.show_lines:
                vis_path = os.path.join(
                    self.output_dir, 
                    f"{name}_detection_{self.method}_{timestamp}{ext}"
                )
                cv2.imwrite(vis_path, visualization)
                
                vis_rotated_path = os.path.join(
                    self.output_dir,
                    f"{name}_detection_rotated_{self.method}_{timestamp}{ext}"
                )
                cv2.imwrite(vis_rotated_path, visualization_rotated)
                logger.info(f"Images de visualisation enregistrées dans: {vis_path} et {vis_rotated_path}")
                return output_path, vis_path, vis_rotated_path
            
            return output_path, None, None
            
        except Exception as e:
            logger.error(f"Erreur lors du redressement de l'image: {str(e)}")
            raise e
    
    def process(self):
        """Traite l'image et retourne les chemins des images résultantes."""
        try:
            logger.info(f"Démarrage du redressement d'image avec la méthode '{self.method}'...")
            
            # Redresser l'image
            output_paths = self.enhance_and_straighten()
            
            logger.info("Redressement d'image terminé avec succès !")
            return output_paths
            
        except Exception as e:
            logger.error(f"Erreur pendant le traitement: {str(e)}")
            raise e

def main():
    """Fonction principale pour exécuter le script."""
    # Parser pour les arguments de ligne de commande
    parser = argparse.ArgumentParser(description="Redressement automatique d'images de copies d'élèves")
    parser.add_argument('--image', '-i', default='assets/proba_6_6_b.jpg',
                      help="Chemin vers l'image à redresser")
    parser.add_argument('--method', '-m', default='hough',
                      choices=['hough', 'contour', 'mser'],
                      help="Méthode de détection d'angle: hough (lignes), contour (formes) ou mser (texte)")
    parser.add_argument('--max-angle', '-a', type=float, default=30,
                      help="Angle maximum de correction en degrés (par défaut: 30)")
    parser.add_argument('--output', '-o', default=None,
                      help="Répertoire de sortie (par défaut: assets/processed)")
    parser.add_argument('--show-lines', '-s', action='store_true',
                      help="Afficher les lignes/contours détectés sur une image supplémentaire")
    args = parser.parse_args()
    
    logger = logging.getLogger('main')
    
    try:
        logger.info("Démarrage du processus de redressement d'image...")
        
        straightener = ImageStraightener(
            input_image_path=args.image,
            method=args.method,
            max_angle=args.max_angle,
            output_dir=args.output,
            show_lines=args.show_lines
        )
        
        # Redresser l'image
        outputs = straightener.process()
        
        if args.show_lines and len(outputs) == 3:
            output_path, vis_path, vis_rotated_path = outputs
            logger.info(f"Image redressée sauvegardée dans: {output_path}")
            logger.info(f"Images de visualisation sauvegardées dans: {vis_path} et {vis_rotated_path}")
        else:
            output_path = outputs[0]
            logger.info(f"Image redressée sauvegardée dans: {output_path}")
        
        logger.info(f"Redressement terminé avec succès avec la méthode '{args.method}'!")
        
    except Exception as e:
        logger.error(f"Erreur pendant le processus de redressement: {str(e)}")
        exit(1)

if __name__ == "__main__":
    main() 