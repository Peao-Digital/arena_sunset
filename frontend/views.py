from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages            

from backend.functions import (f_usuario_possui_grupo, f_nome_usuario)

def f_default_context(user):
  context = {
    'perfil_administrador': f_usuario_possui_grupo(user, 'ADM_SITE'),
    'perfil_atendimento': f_usuario_possui_grupo(user, 'ATENDIMENTO'),
    'perfil_professor': f_usuario_possui_grupo(user, 'PROFESSOR'),
    'perfil_aluno': f_usuario_possui_grupo(user, 'ALUNO'),
  }
  return context

@login_required(login_url="/login")
def index(request):
  context = f_default_context(request.user)

  if request.user.is_authenticated:
    return render(request, 'frontend/index.html', context)
  return render(request, 'frontend/index_publico.html', context)

def logar_usuario(request):
  context = f_default_context(request.user)
  next_url = request.GET.get('next', '/')

  if request.method == 'POST':
    username = request.POST.get('username', '')
    password = request.POST.get('password', '')

    user = authenticate(request, username=username, password=password)
    if user is not None:
      login(request, user)

      nome = f_nome_usuario(user)
      
      messages.info(request, "Seja bem-vindo {}!".format(nome))
      return HttpResponseRedirect(next_url)
    else:
      context['erro_login'] = 'As credenciais informadas não são compatíveis!'
      return render(request, 'frontend/login.html', context)
    
  if request.user.is_authenticated:
    return HttpResponseRedirect('/')
  
  context['next_url'] = next_url
  return render(request, 'frontend/login.html', context)

def deslogar(request):
  logout(request)
  return HttpResponseRedirect('/')

@login_required(login_url="/login")
def index_administracao(request):
  context = f_default_context(request.user)

  if context['perfil_administrador']:
    return render(request, 'frontend/administracao/index.html', context)
  else:
    messages.error(request, "Você não possui acesso para o módulo de administração!")
    return HttpResponseRedirect('/')

@login_required(login_url="/login")
def criar_usuario_view(request):
  context = f_default_context(request.user)

  if context['perfil_administrador']:
    return render(request, 'frontend/administracao/usuarios/criar.html', context)
  else:
    messages.error(request, "Você não possui acesso para o módulo de administração!")
    return HttpResponseRedirect('/')

@login_required(login_url="/login")
def atualizar_usuario_view(request, id):
  context = f_default_context(request.user)

  if context['perfil_administrador']:
    return render(request, 'frontend/administracao/usuarios/atualizar.html', context)
  else:
    messages.error(request, "Você não possui acesso para o módulo de administração!")
    return HttpResponseRedirect('/')

@login_required(login_url="/login")
def criar_pacotes_view(request):
  context = f_default_context(request.user)

  if context['perfil_administrador']:
    return render(request, 'frontend/administracao/pacotes/criar.html', context)
  else:
    messages.error(request, "Você não possui acesso para o módulo de administração!")
    return HttpResponseRedirect('/')

@login_required(login_url="/login")
def criar_alunos_view(request):
  context = f_default_context(request.user)

  if context['perfil_administrador']:
    return render(request, 'frontend/alunos/criar.html', context)
  else:
    messages.error(request, "Você não possui acesso para o módulo de administração!")
    return HttpResponseRedirect('/')
