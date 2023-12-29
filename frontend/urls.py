from django.urls import path
from django.views.generic import RedirectView

from . import views

app_name = 'frontend'
urlpatterns = [
  path('', views.index, name="index"),
  path('login', views.logar_usuario, name="login"),
  path('logout', views.deslogar, name="logout"),

  path('usuarios', views.criar_usuario_view, name="Usuários"),
  path('pacotes', views.criar_pacotes_view, name="Pacotes"),
  path('alunos', views.criar_alunos_view, name="Alunos"),

]