export declare enum BookingStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    CANCELLED = "cancelled"
}
export declare class CreateBookingDto {
    service_id: number;
    booking_date: string;
    booking_time: string;
    full_name: string;
    email: string;
    phone: string;
    special_requests?: string;
}
