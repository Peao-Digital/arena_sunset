from django.urls import path
from django.views.generic import RedirectView

from . import views

app_name = 'frontend'
urlpatterns = [
  path('', views.index, name="index"),
  path('login', views.logar_usuario, name="login"),
  path('logout', views.deslogar, name="logout"),

  path('administracao', views.index_administracao, name="administracao"),
  path('administracao/usuarios/criar', views.criar_usuario_view, name="Criar usuário"),
  path('administracao/usuarios/atualizar/<int:id>', views.atualizar_usuario_view, name="Atualizar usuário"),
  path('administracao/pacotes/criar', views.criar_pacotes_view, name="Criar pacotes"),
  path('alunos/criar', views.criar_alunos_view, name="Criar aluno"),

]