import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard, PermissionGuard, OwnershipGuard } from './guards';

@Module({
  providers: [
    RolesGuard,
    PermissionGuard,
    OwnershipGuard,
    // If you want to apply one of these guards globally, uncomment below:
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
  ],
  exports: [
    RolesGuard,
    PermissionGuard,
    OwnershipGuard,
  ],
})
export class GuardsModule {} 