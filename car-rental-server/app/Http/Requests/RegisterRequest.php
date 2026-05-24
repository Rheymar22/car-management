<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'             => ['required', 'string', 'max:255'],
            'first_name'       => ['nullable', 'string', 'max:100'],
            'last_name'        => ['nullable', 'string', 'max:100'],
            'email'            => ['required', 'email', 'unique:users,email'],
            'password'         => ['required', 'string', 'confirmed',
                                   Password::min(8)->mixedCase()->numbers()],
            'phone'            => ['nullable', 'string', 'max:20'],
            'terms_accepted'   => ['required', 'accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'terms_accepted.accepted' => 'You must accept the Terms and Conditions to register.',
            'password.confirmed'      => 'The password confirmation does not match.',
        ];
    }
}
