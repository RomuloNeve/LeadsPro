UPDATE public.licenses 
SET plan_type = 'anual', 
    is_active = true, 
    expires_at = now() + interval '365 days',
    description = 'Licença anual atribuída manualmente',
    updated_at = now()
WHERE id = '85f9abfe-37e3-46c0-828c-792c77728767';