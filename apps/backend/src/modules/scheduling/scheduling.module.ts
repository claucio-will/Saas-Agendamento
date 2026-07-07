import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AppointmentsService } from './application/appointments.service';
import { AvailabilityService } from './application/availability.service';
import { BookingService } from './application/booking.service';
import { PublicProfileService } from './application/public-profile.service';
import { SchedulingRepository } from './infrastructure/scheduling.repository';
import { AppointmentsController } from './interface/appointments.controller';
import { PublicSchedulingController } from './interface/public-scheduling.controller';

/** Bounded context Scheduling (disponibilidade, agendamento, agenda). */
@Module({
  imports: [AuthModule],
  controllers: [PublicSchedulingController, AppointmentsController],
  providers: [
    SchedulingRepository,
    AvailabilityService,
    BookingService,
    AppointmentsService,
    PublicProfileService,
  ],
})
export class SchedulingModule {}
