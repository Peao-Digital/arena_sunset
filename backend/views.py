from django.http import JsonResponse
from django.views import View
from .services import *

from .functions import f_usuario_possui_grupo  

def apenas_administracao(user):
  if f_usuario_possui_grupo(user, 'ADM_SITE') or user.is_superuser:
    return None, None
  
  return {"erro": "Você não possui acesso para este módulo!"}, 400

def logado(user):
  if user.is_authenticated:
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

class AlunoView(View):
  def get(self, request, id = None):
    if id is None:
      res, status = AlunoSrv.buscar(request)
    else:
      res, status = AlunoSrv.ver(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)
  
  def post(self, request):
    res, status = AlunoSrv.criar(request)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

  def put(self, request, id):
    res, status = AlunoSrv.atualizar(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

  def delete(self, request, id):
    res, status = AlunoSrv.deletar(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

class AlunoAtivacaoView(View):
  def put(self, request, id):
    res, status = logado(request.user)
    if status != 400:
      res, status = AlunoSrv.ativar_desativar(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

class AlunoPacoteView(View):

  def get(self, request, id):
    res, status = logado(request.user)
    if status != 400:
      res, status = PacoteAlunoSrv.buscar_por_aluno(request, id)
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

class PacoteAtivacaoView(View):
  def put(self, request, id):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = PacoteSrv.ativar_desativar(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

class PacoteAlunoView(View):

  def get(self, request, id):
    res, status = logado(request.user)
    if status != 400:
      res, status = PacoteAlunoSrv.buscar_por_pacote(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)
  
  def post(self, request, id):
    res, status = logado(request.user)
    if status != 400:
      res, status = PacoteAlunoSrv.criar(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

  def put(self, request, contrato):
    res, status = logado(request.user)
    if status != 400:
      res, status = PacoteAlunoSrv.cancelar(request, contrato)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

class ReservaEspecialCrudView(View):

  def get(self, request, id):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = AgendaSrv.ver_reserva_especial(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)
  
  def post(self, request):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = AgendaSrv.criar_reserva_especial(request)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

  def delete(self, request, id):
    res, status = apenas_administracao(request.user)
    if status != 400:
      res, status = AgendaSrv.deletar_reserva_especial(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)
  
class ReservaUnica(View):

  def get(self, request, id):
    res, status = logado(request.user)
    if status != 400:
      res, status = AgendaSrv.ver_reserva_unica(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)
  
  def post(self, request):
    res, status = logado(request.user)
    if status != 400:
      res, status = AgendaSrv.criar_reserva_unica(request)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)
  
  def put(self, request, id):
    res, status = logado(request.user)
    if status != 400:
      res, status = AgendaSrv.cancelar_reserva_unica(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

class ReservaNormal(View):
  def get(self, request, id):
    res, status = logado(request.user)
    if status != 400:
      res, status = AgendaSrv.ver_reserva_normal(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)
  
  def post(self, request):
    res, status = logado(request.user)
    if status != 400:
      res, status = AgendaSrv.criar_reserva_normal(request)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)
  
  def put(self, request, id):
    res, status = logado(request.user)
    if status != 400:
      res, status = AgendaSrv.cancelar_reserva_normal(request, id)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)

class AgendaView(View):

  def get(self, request):
    res, status = logado(request.user)
    if status != 400:
      res, status = AgendaSrv.buscar_reservas(request)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)
  
class JobView(View):
  
  def get(self, request):
    res, status = JobSrv.verificar_vencidos(request)
    return JsonResponse(res, json_dumps_params={'ensure_ascii': False}, status=status)