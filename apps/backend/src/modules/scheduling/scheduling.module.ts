import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AppointmentsService } from './application/appointments.service';
import { AvailabilityService } from './application/availability.service';
import { BookingService } from './application/booking.service';
import { CustomerAppointmentsService } from './application/customer-appointments.service';
import { PublicProfileService } from './application/public-profile.service';
import { ReviewsService } from './application/reviews.service';
import { SchedulingRepository } from './infrastructure/scheduling.repository';
import { AppointmentsController } from './interface/appointments.controller';
import { CustomersController } from './interface/customers.controller';
import { EstablishmentsController } from './interface/establishments.controller';
import { MyAppointmentsController } from './interface/my-appointments.controller';
import { PublicSchedulingController } from './interface/public-scheduling.controller';

/** Bounded context Scheduling (disponibilidade, agendamento, agenda). */
@Module({
  imports: [AuthModule],
  controllers: [
    PublicSchedulingController,
    EstablishmentsController,
    AppointmentsController,
    CustomersController,
    MyAppointmentsController,
  ],
  providers: [
    SchedulingRepository,
    AvailabilityService,
    BookingService,
    AppointmentsService,
    CustomerAppointmentsService,
    PublicProfileService,
    ReviewsService,
  ],
})
export class SchedulingModule {}
