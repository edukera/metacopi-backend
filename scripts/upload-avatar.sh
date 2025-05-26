#!/bin/bash

# Script pour charger un avatar dans le bucket S3
# Usage: ./upload-avatar.sh <source_file> <destination_name> [bucket_name]

set -e  # Arrêter le script en cas d'erreur

# Configuration par défaut
DEFAULT_BUCKET="metacopi-storage"  # Remplacez par votre nom de bucket
AVATARS_PREFIX="avatars"

# Fonction d'aide
show_help() {
    echo "Usage: $0 <source_file> <destination_name> [bucket_name]"
    echo ""
    echo "Arguments:"
    echo "  source_file      Chemin vers le fichier image à charger"
    echo "  destination_name Nom du fichier dans S3 (ex: jean_dupont.jpg)"
    echo "  bucket_name      Nom du bucket S3 (optionnel, défaut: $DEFAULT_BUCKET)"
    echo ""
    echo "Exemples:"
    echo "  $0 v3_0188299.jpg jean_dupont.jpg"
    echo "  $0 ./images/photo.jpg marie_martin.jpg mon-bucket"
    echo ""
    echo "Le fichier sera chargé dans: s3://bucket_name/avatars/destination_name"
}

# Vérifier les arguments
if [ $# -lt 2 ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 1
fi

SOURCE_FILE="$1"
DESTINATION_NAME="$2"
BUCKET_NAME="${3:-$DEFAULT_BUCKET}"

# Vérifier que le fichier source existe
if [ ! -f "$SOURCE_FILE" ]; then
    echo "Erreur: Le fichier source '$SOURCE_FILE' n'existe pas."
    exit 1
fi

# Vérifier que AWS CLI est installé
if ! command -v aws &> /dev/null; then
    echo "Erreur: AWS CLI n'est pas installé."
    echo "Installez-le avec: brew install awscli (macOS) ou pip install awscli"
    exit 1
fi

# Vérifier la configuration AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo "Erreur: AWS CLI n'est pas configuré correctement."
    echo "Configurez-le avec: aws configure"
    exit 1
fi

# Construire le chemin de destination S3
S3_PATH="s3://$BUCKET_NAME/$AVATARS_PREFIX/$DESTINATION_NAME"

echo "Chargement de l'avatar..."
echo "Source: $SOURCE_FILE"
echo "Destination: $S3_PATH"
echo ""

# Charger le fichier avec les bonnes métadonnées
aws s3 cp "$SOURCE_FILE" "$S3_PATH" \
    --content-type "image/jpeg" \
    --metadata-directive REPLACE \
    --cache-control "max-age=31536000"

if [ $? -eq 0 ]; then
    echo "✅ Avatar chargé avec succès!"
    echo "URL publique: https://$BUCKET_NAME.s3.amazonaws.com/$AVATARS_PREFIX/$DESTINATION_NAME"
else
    echo "❌ Erreur lors du chargement de l'avatar."
    exit 1
fi 