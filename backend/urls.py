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

  path('alunos/ativar_desativar/<int:id>', AlunoAtivacaoView.as_view(http_method_names=['put']), name="Ativar/desativar aluno"),
  path('alunos/ver/<int:id>', AlunoView.as_view(http_method_names=['get']), name="Ver aluno"),
  path('alunos/listar', AlunoView.as_view(http_method_names=['get']), name="Buscar alunos"),
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
]