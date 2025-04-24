#!/usr/bin/env python3
import cv2
import numpy as np
import os
import logging
import argparse
from datetime import datetime

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('ImageEnhancer')

class ImageEnhancer:
    """
    Classe avancée pour traiter et améliorer des images de copies d'élèves
    avec plusieurs modes de traitement optimisés pour différents types de copies.
    """
    
    def __init__(self, input_image_path, mode='standard', output_dir=None):
        """
        Initialise le processeur d'image avec le chemin de l'image d'entrée et le mode.
        
        Args:
            input_image_path (str): Chemin de l'image à traiter
            mode (str): Mode de traitement ('standard', 'handwriting', 'document', 'scan')
            output_dir (str, optional): Répertoire de sortie personnalisé
        """
        self.input_image_path = input_image_path
        self.mode = mode
        self.output_dir = output_dir or 'assets/processed'
        
        # Créer le dossier de sortie s'il n'existe pas
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
    def enhance_standard(self, image):
        """Amélioration standard pour la plupart des copies."""
        # Convertir en niveaux de gris
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Appliquer un flou gaussien pour réduire le bruit
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Améliorer le contraste avec l'égalisation d'histogramme adaptative
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(blurred)
        
        # Binarisation adaptative pour mieux séparer le texte du fond
        binary = cv2.adaptiveThreshold(
            enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Réduire le bruit avec des opérations morphologiques
        kernel = np.ones((1, 1), np.uint8)
        opening = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        
        # Augmenter la netteté
        sharpen_kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        sharpened = cv2.filter2D(opening, -1, sharpen_kernel)
        
        return sharpened
    
    def enhance_handwriting(self, image):
        """Optimisé pour les écritures manuscrites (stylo, crayon)."""
        # Convertir en niveaux de gris
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Augmenter le contraste
        alpha = 1.5  # Contraste (1.0-3.0)
        beta = 10    # Luminosité (0-100)
        adjusted = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)
        
        # Réduction du bruit préservant les bords
        denoised = cv2.fastNlMeansDenoising(adjusted, None, 10, 7, 21)
        
        # Amélioration adaptative du contraste
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)
        
        # Seuillage adaptatif pour préserver les détails de l'écriture manuscrite
        binary = cv2.adaptiveThreshold(
            enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 15, 8
        )
        
        # Opérations morphologiques pour affiner les traits d'écriture
        kernel = np.ones((1, 1), np.uint8)
        opening = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        
        return opening
    
    def enhance_document(self, image):
        """Optimisé pour les documents imprimés (texte, schémas)."""
        # Convertir en niveaux de gris
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Réduction de bruit 
        denoised = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # Amélioration du contraste
        clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)
        
        # Netteté accrue pour le texte imprimé
        sharpen_kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        sharpened = cv2.filter2D(enhanced, -1, sharpen_kernel)
        
        # Binarisation avec un seuil global optimisé pour les documents imprimés
        _, binary = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return binary
    
    def enhance_scan(self, image):
        """Optimisé pour les images scannées ou prises en photo avec défauts."""
        # Convertir en niveaux de gris
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Correction de l'illumination inégale
        # Créer un arrière-plan flou
        blur = cv2.GaussianBlur(gray, (51, 51), 0)
        
        # Normalisation
        normalized = cv2.divide(gray, blur, scale=255)
        
        # Réduction de bruit
        denoised = cv2.fastNlMeansDenoising(normalized, None, 10, 7, 21)
        
        # Amélioration du contraste
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)
        
        # Binarisation adaptative
        binary = cv2.adaptiveThreshold(
            enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 5
        )
        
        # Correction des ombres et des taches
        kernel = np.ones((1, 1), np.uint8)
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        return cleaned
    
    def auto_rotate(self, image):
        """Détecte et corrige l'orientation d'un document."""
        try:
            # Conversion en niveaux de gris si nécessaire
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Détection des bords
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            
            # Détection des lignes
            lines = cv2.HoughLines(edges, 1, np.pi/180, 200)
            
            if lines is not None and len(lines) > 0:
                # Trouver l'angle de rotation
                angle_sum = 0
                count = 0
                
                for line in lines:
                    rho, theta = line[0]
                    # Filtrer pour ne garder que les lignes horizontales et verticales
                    if theta < np.pi/4 or theta > 3*np.pi/4:
                        angle_sum += theta
                        count += 1
                
                if count > 0:
                    avg_angle = angle_sum / count
                    # Calculer l'angle de rotation en degrés
                    angle_degrees = np.degrees(avg_angle - np.pi/2)
                    
                    # Rotation de l'image
                    (h, w) = gray.shape[:2]
                    center = (w // 2, h // 2)
                    M = cv2.getRotationMatrix2D(center, angle_degrees, 1.0)
                    rotated = cv2.warpAffine(image, M, (w, h), 
                                           flags=cv2.INTER_CUBIC, 
                                           borderMode=cv2.BORDER_REPLICATE)
                    
                    logger.info(f"Image redressée de {angle_degrees:.2f} degrés.")
                    return rotated
            
            # Si aucune ligne n'est détectée ou que la rotation n'est pas nécessaire
            return image
            
        except Exception as e:
            logger.warning(f"Échec de la rotation automatique: {str(e)}")
            return image
    
    def enhance_image(self):
        """Améliore la qualité de l'image selon le mode sélectionné."""
        try:
            # Lire l'image
            logger.info(f"Lecture de l'image: {self.input_image_path}")
            image = cv2.imread(self.input_image_path)
            
            if image is None:
                raise Exception(f"Impossible de lire l'image: {self.input_image_path}")
            
            # Redresser l'image si besoin
            logger.info("Analyse de l'orientation de l'image...")
            image = self.auto_rotate(image)
            
            # Traitement selon le mode sélectionné
            logger.info(f"Application du mode de traitement: {self.mode}")
            if self.mode == 'handwriting':
                processed = self.enhance_handwriting(image)
            elif self.mode == 'document':
                processed = self.enhance_document(image)
            elif self.mode == 'scan':
                processed = self.enhance_scan(image)
            else:  # mode standard par défaut
                processed = self.enhance_standard(image)
            
            # Générer un nom de fichier unique pour la sortie
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            base_name = os.path.basename(self.input_image_path)
            name, ext = os.path.splitext(base_name)
            output_path = os.path.join(self.output_dir, f"{name}_{self.mode}_{timestamp}{ext}")
            
            # Enregistrer l'image traitée
            logger.info(f"Enregistrement de l'image traitée dans: {output_path}")
            cv2.imwrite(output_path, processed)
            
            # Créer une image pour comparaison (côte à côte)
            original_resized = cv2.resize(image, (0, 0), fx=0.5, fy=0.5)
            if len(image.shape) == 3 and len(processed.shape) == 2:
                # Convertir l'image binaire en RGB pour la concaténation
                processed_display = cv2.cvtColor(processed, cv2.COLOR_GRAY2BGR)
            else:
                processed_display = processed
            processed_resized = cv2.resize(processed_display, (0, 0), fx=0.5, fy=0.5)
            
            # S'assurer que les deux images ont la même hauteur
            h1, w1 = original_resized.shape[:2]
            h2, w2 = processed_resized.shape[:2]
            h = max(h1, h2)
            
            # Redimensionner pour avoir la même hauteur
            if h1 != h:
                original_resized = cv2.resize(original_resized, (int(w1 * h / h1), h))
            if h2 != h:
                processed_resized = cv2.resize(processed_resized, (int(w2 * h / h2), h))
            
            # Concaténer les images
            comparison = np.hstack((original_resized, processed_resized))
            comparison_path = os.path.join(self.output_dir, f"{name}_comparison_{timestamp}{ext}")
            cv2.imwrite(comparison_path, comparison)
            logger.info(f"Image de comparaison enregistrée dans: {comparison_path}")
            
            return output_path, comparison_path
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement de l'image: {str(e)}")
            raise e
    
    def process(self):
        """Traite l'image et retourne les chemins des images résultantes."""
        try:
            logger.info(f"Démarrage du traitement d'image en mode '{self.mode}'...")
            
            # Améliorer l'image
            output_path, comparison_path = self.enhance_image()
            
            logger.info("Traitement d'image terminé avec succès !")
            return output_path, comparison_path
            
        except Exception as e:
            logger.error(f"Erreur pendant le traitement: {str(e)}")
            raise e

def main():
    """
    Fonction principale pour exécuter le script.
    Similaire à la fonction bootstrap dans seed.ts, mais avec des options CLI.
    """
    # Parser pour les arguments de ligne de commande
    parser = argparse.ArgumentParser(description="Amélioration d'images de copies d'élèves")
    parser.add_argument('--image', '-i', default='assets/proba_6_6_b.jpg',
                      help="Chemin vers l'image à traiter")
    parser.add_argument('--mode', '-m', default='standard',
                      choices=['standard', 'handwriting', 'document', 'scan'],
                      help="Mode d'amélioration de l'image")
    parser.add_argument('--output', '-o', default=None,
                      help="Répertoire de sortie (par défaut: assets/processed)")
    args = parser.parse_args()
    
    logger = logging.getLogger('main')
    
    try:
        logger.info("Démarrage du processus d'amélioration d'image...")
        
        enhancer = ImageEnhancer(
            input_image_path=args.image,
            mode=args.mode,
            output_dir=args.output
        )
        
        # Traiter l'image
        output_path, comparison_path = enhancer.process()
        
        logger.info(f"Image traitée avec succès en mode '{args.mode}'")
        logger.info(f"Image améliorée sauvegardée dans: {output_path}")
        logger.info(f"Image de comparaison sauvegardée dans: {comparison_path}")
        logger.info("Processus terminé avec succès !")
        
    except Exception as e:
        logger.error(f"Erreur pendant le processus d'amélioration: {str(e)}")
        exit(1)

if __name__ == "__main__":
    main() 