import { BookingStatus } from '../dto/create-booking.dto';
export interface Booking {
    id: string;
    user_id: string;
    user_phone: string;
    service_id: string;
    booking_date: string;
    booking_time: string;
    special_requests: string | null;
    full_name: string;
    email: string;
    phone: string;
    status: BookingStatus;
    created_at: string;
}
