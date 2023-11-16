from django.urls import path
from .views import *

app_name = 'backend'
urlpatterns = [
  path('grupos/buscar', GrupoView.as_view(http_method_names=['get']), name="Ver os grupos"),

  path('usuarios/ver/<int:id>', UsuarioView.as_view(http_method_names=['get']), name="Ver usuário"),
  path('usuarios/criar', UsuarioView.as_view(http_method_names=['post']), name="Criar usuário"),
  path('usuarios/atualizar/<int:id>', UsuarioView.as_view(http_method_names=['put']), name="atualizar usuário"),
  path('usuarios/atualizar_foto/<int:id>', UsuarioFotoView.as_view(http_method_names=['post']), name="Atualizar foto do usuário"),
  path('usuarios/deletar_foto/<int:id>', UsuarioFotoView.as_view(http_method_names=['delete']), name="Deletar foto do usuário"),
  path('usuarios/ativar_desativar/<int:id>', UsuarioAtivacaoView.as_view(http_method_names=['put']), name="Ativar/desativar usuário"),
  path('usuarios/deletar/<int:id>', UsuarioView.as_view(http_method_names=['delete']), name="Deletar usuário"),
  path('usuarios/buscar', ListaUsuariosView.as_view(http_method_names=['get']), name="Buscar usuários")
]