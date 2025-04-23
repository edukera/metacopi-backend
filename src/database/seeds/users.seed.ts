import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserDocument, UserRole } from '../../modules/users/user.schema';

// Interface to define the structure of the users JSON
export interface UserSeedData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified: boolean;
}

@Injectable()
export class UsersSeedService {
  private readonly logger = new Logger(UsersSeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seed(): Promise<void> {
    try {
      // Path to the users JSON file
      const seedFilePath = path.resolve('src/database/seeds/data/users.json');
      const exampleFilePath = path.resolve('src/database/seeds/data/users.example.json');
      
      // Check if the file exists
      if (!fs.existsSync(seedFilePath)) {
        this.logger.warn(`Users seed file does not exist: ${seedFilePath}`);
        this.logger.warn(`Use the example file as a reference: ${exampleFilePath}`);
        return;
      }

      // Read JSON file
      const usersData: UserSeedData[] = JSON.parse(fs.readFileSync(seedFilePath, 'utf8'));
      
      // Counter for created users
      let createdCount = 0;
      
      // Process each user in the file
      for (const userData of usersData) {
        // Check if the user already exists
        const existingUser = await this.userModel.findOne({ email: userData.email });
        
        if (existingUser) {
          this.logger.log(`User ${userData.email} already exists, skipped.`);
          continue;
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Create the new user
        const newUser = new this.userModel({
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          emailVerified: userData.emailVerified,
        });
        
        await newUser.save();
        createdCount++;
        this.logger.log(`User successfully created: ${userData.email}`);
      }
      
      this.logger.log(`Users seeding completed. ${createdCount} users created.`);
    } catch (error) {
      this.logger.error('Error during users seeding:', error);
      throw error;
    }
  }
} 