from django.http import JsonResponse
from django.views import View
from .services import *

from .functions import f_usuario_possui_grupo  

def apenas_administracao(user):
  if f_usuario_possui_grupo(user, 'ADM_SITE'):
    return None, None
  
  return {"erro": "Você não possui acesso para este módulo!"}, 400

class GrupoView(View):
  def get(self, request):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = GruposSrv.buscar(request)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

class UsuarioCRUDView(View):
  def get(self, request, id = None):
    res, status = apenas_administracao(request.user)
    if status != 400:
      if id is None:
        res, status = UsuarioSrv.buscar(request)
      else:
        res, status = UsuarioSrv.ver(request, id)
    
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

  def post(self, request):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = UsuarioSrv.criar(request)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

  def put(self, request, id):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = UsuarioSrv.atualizar(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

  def delete(self, request, id):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = UsuarioSrv.deletar(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

class UsuarioFotoView(View):
  def post(self, request, id):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = UsuarioSrv.atualizar_foto(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)
  
  def delete(self, request, id):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = UsuarioSrv.deletar_foto(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

class UsuarioAtivacaoView(View):
  def put(self, request, id):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = UsuarioSrv.ativar_desativar(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

class UsuarioSenhaView(View):
  def put(self, request):
    res, status = UsuarioSrv.trocar_senha(request)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

class ProfessorView(View):
  def get(self, request, id = None):
    if id is None:
      res, status = ProfessorSrv.listar(request)
    else:
      res, status = ProfessorSrv.ver_horarios(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

class PacoteCrudView(View):
  def get(self, request, id = None):
    res, status = apenas_administracao(request.user)
    if status != 400:
      if id is None:
        res, status = PacoteSrv.listar(request)
      else:
        res, status = PacoteSrv.ver(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

  def post(self, request):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = PacoteSrv.criar(request)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

  def put(self, request, id):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = PacoteSrv.atualizar(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

  def delete(self, request, id):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = PacoteSrv.deletar(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)