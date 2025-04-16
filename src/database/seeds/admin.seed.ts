import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../../modules/users/user.schema';

@Injectable()
export class AdminSeedService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seed(): Promise<void> {
    // Check if an admin already exists
    const adminCount = await this.userModel.countDocuments({ role: UserRole.ADMIN });
    
    if (adminCount > 0) {
      console.log('An administrator already exists in the database');
      return;
    }

    // Get credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@metacopi.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Super';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'Admin';

    try {
      // Create the admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const adminUser = new this.userModel({
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: UserRole.ADMIN,
        emailVerified: true,
      });

      await adminUser.save();
      console.log(`Administrator user successfully created: ${adminEmail}`);
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  }
} 