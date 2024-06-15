const { z } = require('zod');

const registerSchema = z.object({
    fullName: z
        .string({ required_error: 'Full name can not empty' })
        .min(3, { message: 'Full name must be at least 3 characters' })
        .max(50, { message: 'Full name must be maximum 50 characters' }),
    username: z
        .string({ required_error: 'Username can not empty' })
        .min(3, { message: 'Username must be at least 3 characters' })
        .max(20, { message: 'Username must be maximum 50 characters' }),
    email: z
        .string({ required_error: 'Email can not empty' })
        .email({ message: 'Email must be a valid email' }),
    phoneNumber: z
        .string()
        .min(10, { message: 'Phone number must be at least 10 characters' })
        .optional()
        .or(z.literal(''))
        .transform((e) => (e === '' ? undefined : e)),
    password: z
        .string({ required_error: 'Password can not empty' })
        .min(8, { message: 'Password must be at least 6 characters' })
        .refine((password) => /^(?=.*[A-Za-z])(?=.*\d).+$/.test(password), {
            message: 'Password must contain at least one letter and one number',
        }),
});

const loginSchema = z.object({
    email: z
        .string({
            required_error: 'Email can not empty',
        })
        .email({
            message: 'Invalid email',
        }),
    password: z
        .string({
            required_error: 'Password can not empty',
        })
        .min(6, { message: 'Password must be at least 6 characters' }),
});

const createGroupFormSchema = z.object({
    title: z
        .string({ required_error: 'Group name can not empty' })
        .min(3, { message: 'Group name must be at least 3 characters' })
        .max(50, { message: 'Group name must be maximum 50 characters' }),
    description: z
        .string()
        .optional()
        .or(z.literal(''))
        .transform((e) => (e === '' ? undefined : e)),
});

const createAlbumFormSchema = z.object({
    title: z
        .string({ required_error: 'Album name can not empty' })
        .min(3, { message: 'Album name must be at least 3 characters' })
        .max(50, { message: 'Album name must be maximum 50 characters' }),
    description: z
        .string()
        .optional()
        .or(z.literal(''))
        .transform((e) => (e === '' ? undefined : e)),
});

module.exports = {
    registerSchema,
    loginSchema,
    createGroupFormSchema,
    createAlbumFormSchema,
};
