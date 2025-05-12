import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

import { User } from '../../modules/users/user.schema';
import { Class } from '../../modules/classes/class.schema';
import { Task } from '../../modules/tasks/task.schema';
import { Membership } from '../../modules/memberships/membership.schema';
import { Submission } from '../../modules/submissions/submission.schema';
import { Correction } from '../../modules/corrections/correction.schema';
import { Comment } from '../../modules/comments/comment.schema';
import { AIComment } from '../../modules/ai-comments/ai-comment.schema';
import { Annotation } from '../../modules/annotations/annotation.schema';
import { AIAnnotation } from '../../modules/ai-annotations/ai-annotation.schema';

@Injectable()
export class DumpService {
  private readonly logger = new Logger(DumpService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Class.name) private classModel: Model<Class>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(Membership.name) private membershipModel: Model<Membership>,
    @InjectModel(Submission.name) private submissionModel: Model<Submission>,
    @InjectModel(Correction.name) private correctionModel: Model<Correction>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(AIComment.name) private aiCommentModel: Model<AIComment>,
    @InjectModel(Annotation.name) private annotationModel: Model<Annotation>,
    @InjectModel(AIAnnotation.name) private aiAnnotationModel: Model<AIAnnotation>,
  ) {}

  async dump(outputPath?: string): Promise<void> {
    try {
      // Définir le chemin de sortie par défaut si non spécifié
      const dumpFilePath = outputPath || path.resolve('db-dump.json');
      
      this.logger.log(`Starting database dump process to ${dumpFilePath}...`);

      // Récupérer toutes les entités
      const users = await this.userModel.find().lean();
      const classes = await this.classModel.find().lean();
      const tasks = await this.taskModel.find().lean();
      const memberships = await this.membershipModel.find().lean();
      const submissions = await this.submissionModel.find().lean();
      const corrections = await this.correctionModel.find().lean();
      const comments = await this.commentModel.find().lean();
      const aiComments = await this.aiCommentModel.find().lean();
      const annotations = await this.annotationModel.find().lean();
      const aiAnnotations = await this.aiAnnotationModel.find().lean();

      // Nettoyer les données sensibles ou inutiles
      const cleanUsers = users.map(user => {
        // Ne pas inclure les hachages de mot de passe
        const { password, ...rest } = user as any;
        return {
          ...rest,
          // Ajouter un mot de passe factice pour permettre le seed
          password: 'password123'
        };
      });

      // Nettoyer les commentaires et annotations
      const cleanComments = comments.map(comment => {
        const cleanComment = { ...comment } as any;
        // Supprimer les champs timestamps
        delete cleanComment.createdAt;
        delete cleanComment.updatedAt;
        // Ajouter un status par défaut si absent
        if (!cleanComment.status) {
          cleanComment.status = 'pending';
        }
        return cleanComment;
      });

      // Désérialiser le champ value des annotations et l'intégrer
      const cleanAnnotations = annotations.map(annotation => {
        const cleanAnnotation = { ...annotation } as any;
        // Supprimer les champs timestamps
        delete cleanAnnotation.createdAt;
        delete cleanAnnotation.updatedAt;
        
        // Ajouter un status par défaut si absent
        if (!cleanAnnotation.status) {
          cleanAnnotation.status = 'pending';
        }
        
        // Désérialiser le champ value et intégrer ses propriétés
        try {
          if (cleanAnnotation.value) {
            const valueObj = JSON.parse(cleanAnnotation.value);
            // Supprimer le champ value d'origine
            delete cleanAnnotation.value;
            // Fusionner les propriétés désérialisées
            Object.assign(cleanAnnotation, valueObj);
          }
        } catch (error) {
          this.logger.warn(`Failed to parse value field for annotation ${cleanAnnotation.id}: ${error.message}`);
        }
        
        return cleanAnnotation;
      });

      // Désérialiser le champ value des annotations IA et l'intégrer
      const cleanAIAnnotations = aiAnnotations.map(aiAnnotation => {
        const cleanAIAnnotation = { ...aiAnnotation } as any;
        // Supprimer les champs timestamps
        delete cleanAIAnnotation.createdAt;
        delete cleanAIAnnotation.updatedAt;
        
        // Ajouter un status par défaut si absent
        if (!cleanAIAnnotation.status) {
          cleanAIAnnotation.status = 'pending';
        }
        
        // Désérialiser le champ value et intégrer ses propriétés
        try {
          if (cleanAIAnnotation.value) {
            const valueObj = JSON.parse(cleanAIAnnotation.value);
            // Supprimer le champ value d'origine
            delete cleanAIAnnotation.value;
            // Fusionner les propriétés désérialisées
            Object.assign(cleanAIAnnotation, valueObj);
          }
        } catch (error) {
          this.logger.warn(`Failed to parse value field for AI annotation ${cleanAIAnnotation.id}: ${error.message}`);
        }
        
        return cleanAIAnnotation;
      });

      // Créer l'objet de données
      const dumpData = {
        users: cleanUsers,
        classes,
        tasks,
        memberships,
        submissions,
        corrections,
        comments: cleanComments,
        'ai-comments': aiComments,
        annotations: cleanAnnotations,
        'ai-annotations': cleanAIAnnotations
      };

      // Supprimer les propriétés MongoDB internes
      const cleanData = this.cleanMongoDBData(dumpData);

      // Créer le dossier de destination si nécessaire
      const dir = path.dirname(dumpFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Écrire dans le fichier
      fs.writeFileSync(dumpFilePath, JSON.stringify(cleanData, null, 2), 'utf8');
      
      this.logger.log(`Database successfully dumped to ${dumpFilePath}`);
    } catch (error) {
      this.logger.error('Error during dump process:', error);
      throw error;
    }
  }

  /**
   * Nettoie les données MongoDB en supprimant les propriétés internes
   */
  private cleanMongoDBData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.cleanMongoDBData(item));
    } else if (data !== null && typeof data === 'object') {
      const cleanedData: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        // Ignorer les propriétés internes MongoDB et les timestamps génériques
        if (key === '_id' || key === '__v' || 
            key === 'createdAt' || key === 'updatedAt') {
          continue;
        }
        
        // Traiter les objets imbriqués
        cleanedData[key] = this.cleanMongoDBData(value);
      }
      
      return cleanedData;
    }
    
    return data;
  }
} 