from django.urls import path
from .views import *

app_name = 'backend'
urlpatterns = [
  path('grupos/buscar', GrupoView.as_view(http_method_names=['get']), name="Ver os grupos"),

  path('usuarios/ver/<int:id>', UsuarioCRUDView.as_view(http_method_names=['get']), name="Ver usuário"),
  path('usuarios/criar', UsuarioCRUDView.as_view(http_method_names=['post']), name="Criar usuário"),
  path('usuarios/atualizar/<int:id>', UsuarioCRUDView.as_view(http_method_names=['put']), name="atualizar usuário"),
  path('usuarios/atualizar_foto/<int:id>', UsuarioFotoView.as_view(http_method_names=['post']), name="Atualizar foto do usuário"),
  path('usuarios/deletar_foto/<int:id>', UsuarioFotoView.as_view(http_method_names=['delete']), name="Deletar foto do usuário"),
  path('usuarios/ativar_desativar/<int:id>', UsuarioAtivacaoView.as_view(http_method_names=['put']), name="Ativar/desativar usuário"),
  path('usuarios/deletar/<int:id>', UsuarioCRUDView.as_view(http_method_names=['delete']), name="Deletar usuário"),
  path('usuarios/buscar', UsuarioCRUDView.as_view(http_method_names=['get']), name="Buscar usuários"),
  path('usuarios/trocar_senha', UsuarioSenhaView.as_view(http_method_names=['put']), name="Trocar senha de usuário"),

  path('professores/listar', ProfessorView.as_view(http_method_names=['get']), name="Listar os professores"),
  path('professores/<int:id>/horarios', ProfessorView.as_view(http_method_names=['get']), name="Listar os horarios do professor"),

  path('pacotes/ver/<int:id>', PacoteCrudView.as_view(http_method_names=['get']), name="Ver pacote"),
  path('pacotes/criar', PacoteCrudView.as_view(http_method_names=['post']), name="Criar pacote"),
  path('pacotes/atualizar/<int:id>', PacoteCrudView.as_view(http_method_names=['put']), name="Atualizar pacote"),
  path('pacotes/deletar/<int:id>', PacoteCrudView.as_view(http_method_names=['delete']), name="Deletar pacote"),
  path('pacotes/listar', PacoteCrudView.as_view(http_method_names=['get']), name="Buscar pacotes"),

  path('agenda/reservar_especial/criar', ReservaEspecialCrudView.as_view(http_method_names=['post']), name="Reservar dia especial"),
  path('agenda/reservar_especial/<int:id>', ReservaEspecialCrudView.as_view(http_method_names=['delete']), name="Reservar dia especial"),

  path('agenda/reserva/criar', ReservaNormalView.as_view(http_method_names=['post']), name="Criar reserva"),
  path('agenda/reserva/atualizar/<int:id>', ReservaNormalView.as_view(http_method_names=['put']), name="Criar reserva"),
  path('agenda/reserva/deletar/<int:id>', ReservaNormalView.as_view(http_method_names=['delete']), name="Deletar reserva"),
  path('agenda/reserva/ver/<int:id>', ReservaNormalView.as_view(http_method_names=['get']), name="Ver reserva"),
  path('agenda/reserva/buscar', ReservaNormalView.as_view(http_method_names=['get']), name="Buscar reservas"),
  path('agenda/reserva/cancelar/<int:id>', CancelamentoReservaView.as_view(http_method_names=['put']), name="Cancelar reserva"),
  path('agenda/reserva/presenca/buscar/<int:id>', ListaPresencaReservaView.as_view(http_method_names=['get']), name="Buscar lista de presença"),
  path('agenda/reserva/presenca/confirmar/<int:id>', ListaPresencaReservaView.as_view(http_method_names=['put']), name="Confirmar presença")
]