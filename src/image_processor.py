#!/usr/bin/env python3
import cv2
import numpy as np
import os
import logging
from datetime import datetime

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('ImageProcessor')

class ImageProcessor:
    """
    Classe pour traiter et améliorer des images de copies d'élèves.
    Similaire à la structure des services de seed dans NestJS.
    """
    
    def __init__(self, input_image_path):
        """Initialise le processeur d'image avec le chemin de l'image d'entrée."""
        self.input_image_path = input_image_path
        self.output_dir = 'assets/processed'
        
        # Créer le dossier de sortie s'il n'existe pas
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
    def enhance_image(self):
        """Améliore la qualité de l'image pour une meilleure lisibilité."""
        try:
            # Lire l'image
            logger.info(f"Lecture de l'image: {self.input_image_path}")
            image = cv2.imread(self.input_image_path)
            
            if image is None:
                raise Exception(f"Impossible de lire l'image: {self.input_image_path}")
            
            # 1. Convertir en niveaux de gris
            logger.info("Conversion en niveaux de gris")
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 2. Appliquer un flou gaussien pour réduire le bruit
            logger.info("Application d'un flou gaussien pour réduire le bruit")
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # 3. Améliorer le contraste avec l'égalisation d'histogramme adaptative
            logger.info("Amélioration du contraste")
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(blurred)
            
            # 4. Binarisation adaptative pour mieux séparer le texte du fond
            logger.info("Binarisation adaptative")
            binary = cv2.adaptiveThreshold(
                enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )
            
            # 5. Réduire le bruit avec des opérations morphologiques
            logger.info("Réduction du bruit avec des opérations morphologiques")
            kernel = np.ones((1, 1), np.uint8)
            opening = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
            
            # 6. Augmenter la netteté
            logger.info("Augmentation de la netteté")
            sharpen_kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
            sharpened = cv2.filter2D(opening, -1, sharpen_kernel)
            
            # 7. Détection et redressement si nécessaire
            # Cette partie peut être commentée/décommentée selon les besoins
            """
            logger.info("Détection des contours pour redressement")
            edges = cv2.Canny(sharpened, 50, 150, apertureSize=3)
            lines = cv2.HoughLines(edges, 1, np.pi/180, 200)
            
            if lines is not None and len(lines) > 0:
                # Trouver l'angle de rotation
                angle_sum = 0
                count = 0
                for line in lines:
                    rho, theta = line[0]
                    if theta < np.pi/4 or theta > 3*np.pi/4:
                        angle_sum += theta
                        count += 1
                
                if count > 0:
                    avg_angle = angle_sum / count
                    angle_degrees = np.degrees(avg_angle - np.pi/2)
                    
                    # Rotation de l'image
                    (h, w) = sharpened.shape[:2]
                    center = (w // 2, h // 2)
                    M = cv2.getRotationMatrix2D(center, angle_degrees, 1.0)
                    sharpened = cv2.warpAffine(sharpened, M, (w, h), 
                                            flags=cv2.INTER_CUBIC, 
                                            borderMode=cv2.BORDER_REPLICATE)
            """
            
            # Générer un nom de fichier unique pour la sortie
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            base_name = os.path.basename(self.input_image_path)
            name, ext = os.path.splitext(base_name)
            output_path = os.path.join(self.output_dir, f"{name}_processed_{timestamp}{ext}")
            
            # Enregistrer l'image traitée
            logger.info(f"Enregistrement de l'image traitée dans: {output_path}")
            cv2.imwrite(output_path, sharpened)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement de l'image: {str(e)}")
            raise e
    
    def process_all(self):
        """Traite l'image et retourne le chemin de l'image traitée."""
        try:
            logger.info("Démarrage du traitement d'image...")
            
            # Améliorer l'image
            output_path = self.enhance_image()
            
            logger.info("Traitement d'image terminé avec succès !")
            return output_path
            
        except Exception as e:
            logger.error(f"Erreur pendant le traitement: {str(e)}")
            raise e

def main():
    """
    Fonction principale pour exécuter le script.
    Similaire à la fonction bootstrap dans seed.ts.
    """
    logger = logging.getLogger('main')
    
    try:
        logger.info("Démarrage du processus de traitement d'image...")
        
        input_image_path = 'assets/proba_6_6_b.jpg'
        processor = ImageProcessor(input_image_path)
        
        # Traiter l'image
        output_path = processor.process_all()
        
        logger.info(f"Image traitée avec succès et enregistrée dans: {output_path}")
        logger.info("Processus terminé avec succès !")
        
    except Exception as e:
        logger.error(f"Erreur pendant le processus de traitement: {str(e)}")
        exit(1)

if __name__ == "__main__":
    main() 