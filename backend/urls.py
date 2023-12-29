from django.urls import path
from .views import *

app_name = 'backend'
urlpatterns = [
  path('grupos/buscar', GrupoView.as_view(http_method_names=['get']), name="Ver os grupos"),

  path('usuarios/ver/<int:id>', UsuarioCRUDView.as_view(http_method_names=['get']), name="Ver usuário"),
  path('usuarios/criar', UsuarioCRUDView.as_view(http_method_names=['post']), name="Criar usuário"),
  path('usuarios/atualizar/<int:id>', UsuarioCRUDView.as_view(http_method_names=['put']), name="atualizar usuário"),
  path('usuarios/ativar_desativar/<int:id>', UsuarioAtivacaoView.as_view(http_method_names=['put']), name="Ativar/desativar usuário"),
  path('usuarios/deletar/<int:id>', UsuarioCRUDView.as_view(http_method_names=['delete']), name="Deletar usuário"),
  path('usuarios/buscar', UsuarioCRUDView.as_view(http_method_names=['get']), name="Buscar usuários"),
  path('usuarios/trocar_senha', UsuarioSenhaView.as_view(http_method_names=['put']), name="Trocar senha de usuário"),
  path('usuarios/foto/gravar/<int:id>', UsuarioFotoView.as_view(http_method_names=['post']), name="Gravar imagem do usuário"),
  path('usuarios/foto/deletar/<int:id>', UsuarioFotoView.as_view(http_method_names=['delete']), name="Deletar imagem do usuário"),

  path('professores/listar', ProfessorView.as_view(http_method_names=['get']), name="Listar os professores"),

  path('alunos/ativar_desativar/<int:id>', AlunoAtivacaoView.as_view(http_method_names=['put']), name="Ativar/desativar aluno"),
  path('alunos/ver/<int:id>', AlunoView.as_view(http_method_names=['get']), name="Ver aluno"),
  path('alunos/listar', AlunoView.as_view(http_method_names=['get']), name="Buscar alunos"),
  path('alunos/contratantes', ContratanteView.as_view(http_method_names=['get']), name="Buscar alunos contratantes/pagantes"),
  path('alunos/criar', AlunoView.as_view(http_method_names=['post']), name="Criar aluno"),
  path('alunos/atualizar/<int:id>', AlunoView.as_view(http_method_names=['put']), name="Atualizar aluno"),
  path('alunos/deletar/<int:id>', AlunoView.as_view(http_method_names=['delete']), name="Deletar aluno"),
  path('alunos/<int:id>/pacotes/buscar', AlunoPacoteView.as_view(http_method_names=['get']), name="Buscar os pacotes do aluno"),

  path('pacotes/ativar_desativar/<int:id>', PacoteAtivacaoView.as_view(http_method_names=['put']), name="Ativar/desativar pacote"),
  path('pacotes/ver/<int:id>', PacoteCrudView.as_view(http_method_names=['get']), name="Ver pacote"),
  path('pacotes/criar', PacoteCrudView.as_view(http_method_names=['post']), name="Criar pacote"),
  path('pacotes/atualizar/<int:id>', PacoteCrudView.as_view(http_method_names=['put']), name="Atualizar pacote"),
  path('pacotes/deletar/<int:id>', PacoteCrudView.as_view(http_method_names=['delete']), name="Deletar pacote"),
  path('pacotes/listar', PacoteCrudView.as_view(http_method_names=['get']), name="Buscar pacotes"),
  path('pacotes/<int:id>/contratos/buscar', PacoteAlunoView.as_view(http_method_names=['get']), name="Buscar contratos do pacote"),
  path('pacotes/<int:id>/contratar', PacoteAlunoView.as_view(http_method_names=['post']), name="Contratar pacote"),
  path('pacotes/cancelar_contrato/<int:contrato>', PacoteAlunoView.as_view(http_method_names=['put']), name="Cancelar contrato"),

  path('agenda/buscar', AgendaView.as_view(http_method_names=['get']), name="Buscar reservas"),
  path('agenda/verificar_vencidos', JobView.as_view(http_method_names=['get']), name="Verificar vencidos"),

  path('agenda/reserva_especial/ver/<int:id>', ReservaEspecialCrudView.as_view(http_method_names=['get']), name="Ver reserva especial"),
  path('agenda/reserva_especial/criar', ReservaEspecialCrudView.as_view(http_method_names=['post']), name="Criar reserva especial"),
  path('agenda/reserva_especial/deletar/<int:id>', ReservaEspecialCrudView.as_view(http_method_names=['delete']), name="Deletar reserva especial"),

  path('agenda/reserva_unica/ver/<int:id>', ReservaUnica.as_view(http_method_names=['get']), name="Ver reserva única"),
  path('agenda/reserva_unica/criar', ReservaUnica.as_view(http_method_names=['post']), name="Criar reserva única"),
  path('agenda/reserva_unica/cancelar/<int:id>', ReservaUnica.as_view(http_method_names=['put']), name="Cancelar reserva única"),

  path('agenda/reserva_normal/ver/<int:id>', ReservaNormal.as_view(http_method_names=['get']), name="Ver reserva normal"),
  path('agenda/reserva_normal/criar', ReservaNormal.as_view(http_method_names=['post']), name="Criar reserva normal"),
  path('agenda/reserva_normal/cancelar/<int:id>', ReservaNormal.as_view(http_method_names=['put']), name="Cancelar reserva normal"),
  
]