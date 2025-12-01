<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller as BaseController;
use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'Agenda+ API',
    description: 'API RESTful para sistema de gestão de consultas médicas Agenda+',
    contact: new OA\Contact(
        name: 'Suporte Agenda+',
        email: 'suporte@agendaplus.com'
    ),
    license: new OA\License(
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
    )
)]
#[OA\Server(
    url: '/api',
    description: 'Servidor da API'
)]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    name: 'Authorization',
    in: 'header',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Token de autenticação Sanctum'
)]
#[OA\Tag(name: 'Autenticação', description: 'Endpoints de autenticação e gerenciamento de sessão')]
#[OA\Tag(name: 'Consultas', description: 'Gerenciamento de consultas médicas')]
#[OA\Tag(name: 'Pacientes', description: 'Gerenciamento de pacientes')]
#[OA\Tag(name: 'Médicos', description: 'Gerenciamento de médicos')]
#[OA\Tag(name: 'Agenda', description: 'Gerenciamento de agendas médicas')]
#[OA\Tag(name: 'Observações', description: 'Observações clínicas e prontuário')]
#[OA\Tag(name: 'Notificações', description: 'Sistema de notificações')]
#[OA\Tag(name: 'Relatórios', description: 'Relatórios administrativos')]
#[OA\Tag(name: 'Convênios', description: 'Gerenciamento de convênios médicos')]
#[OA\Tag(name: 'Administração', description: 'Endpoints administrativos')]
class Controller extends BaseController {}
