import { BookingStatus } from '../dto/create-booking.dto';
export interface Booking {
    id: number;
    user_phone: string;
    service_id: number;
    booking_date: string;
    booking_time: string;
    special_requests: string | null;
    full_name: string;
    email: string;
    phone: string;
    status: BookingStatus;
    created_at: string;
}
