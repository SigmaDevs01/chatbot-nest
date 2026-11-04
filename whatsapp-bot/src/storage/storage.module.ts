import { Module } from '@nestjs/common';
import { MessagingModule } from '../messaging/messaging.module';
import { StorageService } from './storage.service';
import { PhotoService } from './photo.service';
/** Expõe PhotoService; detalhes do Supabase ficam encapsulados no módulo. */
@Module({
  imports: [MessagingModule],
  providers: [StorageService, PhotoService],
  exports: [PhotoService],
})
export class StorageModule {}
