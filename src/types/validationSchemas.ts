import { z } from 'zod';

// Схема валидации для обновления профиля
export const updateProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100).optional(),
  last_name: z.string().min(1, 'Last name is required').max(100).optional(),
  middle_name: z.string().max(100).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  passport_number: z.string().min(1, 'Passport number is required').max(20).optional(),
  address: z.object({
    country: z.string().optional(),
    region: z.string().optional(),
    city: z.string().optional(),
    street: z.string().optional(),
    house: z.string().optional(),
    apartment: z.string().optional(),
  }).optional(),
});

// Схема валидации для фильтров транспортных средств
export const getVehiclesFilterSchema = z.object({
  status: z.string().optional(),
  lat: z.string().regex(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/, 'Invalid latitude').optional(),
  lng: z.string().regex(/^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/, 'Invalid longitude').optional(),
  radius: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid radius').optional(),
});

// Схема валидации для получения транспортных средств на станции
export const getVehiclesAtStationSchema = z.object({
  stationId: z.string().uuid('Invalid station ID'),
});

// Схема валидации для получения станции по ID
export const getStationByIdSchema = z.object({
  id: z.string().uuid('Invalid station ID'),
});

// Типы для использования в контроллерах
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type GetVehiclesFilterInput = z.infer<typeof getVehiclesFilterSchema>;
export type GetVehiclesAtStationInput = z.infer<typeof getVehiclesAtStationSchema>;
export type GetStationByIdInput = z.infer<typeof getStationByIdSchema>;