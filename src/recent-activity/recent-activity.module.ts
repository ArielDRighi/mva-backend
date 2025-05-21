import { Module } from '@nestjs/common';
import { RecentActivityService } from './recent-activity.service';
import { RecentActivityController } from './recent-activity.controller';

@Module({
  controllers: [RecentActivityController],
  providers: [RecentActivityService],
})
export class RecentActivityModule {}
