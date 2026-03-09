<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendMoneyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recipient_account_number' => ['required', 'string', 'exists:accounts,account_number'],
            'amount'                   => ['required', 'numeric', 'gt:0'],
            'description'              => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'recipient_account_number.required' => 'Le numéro de compte du bénéficiaire est requis.',
            'recipient_account_number.exists'   => 'Ce numéro de compte est introuvable.',
            'amount.required'                   => 'Le montant est requis.',
            'amount.gt'                         => 'Le montant doit être supérieur à zéro.',
        ];
    }
}
