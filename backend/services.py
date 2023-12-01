import json
import os

from django.core.exceptions import (ValidationError, ObjectDoesNotExist)
from django.db import transaction
from django.db.models import Q
from django.contrib.auth.models import (User, Group)
from django.conf import settings
from django.core.files.storage import FileSystemStorage

from .functions import *

from .models import *

def upload_file(f, name, dirpath):
  try:
    fs = FileSystemStorage(location=dirpath)
    fs.save(name, f)
    return name
  except Exception as e:
    return ''

class GruposSrv():

  @staticmethod
  def buscar(request):
    try:
      dados = Group.objects.values('id','name', 'tipo_grupo__tipo').all()
      return {'dados': list(dados)}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

class UsuarioSrv():

  @staticmethod
  def ver(request, id):
    try:
      u = User.objects.select_related().get(pk=id, is_superuser=False)

      grupos = []
      grupos_id = []

      for grupo in u.groups.all():
        grupos.append(grupo.name)
        grupos_id.append(grupo.id)

      foto = ''
      if u.perfil:
        foto = settings.UPLOAD_URL + 'usuarios/' + u.perfil.foto_perfil

      d_json = {
        'id': u.id,
        'usuario': u.username,
        'nome': u.first_name,
        'sobrenome': u.last_name,
        'email': u.email,
        'ativo': u.is_active,
        'foto': foto,
        'grupos': grupos,
        'grupos_id': grupos_id
      }

      return {'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def criar(request):
    try:
      post_data = json.loads(request.body)

      with transaction.atomic():
        usuario = post_data.get('usuario', None)
        senha = post_data.get('senha', None)
        nome = post_data.get('nome', '')
        sobrenome = post_data.get('sobrenome', '')
        email = post_data.get('email', '')
        cpf = post_data.get('cpf', '')
        grupo = post_data.get('grupo', None)

        if len(User.objects.filter(username=usuario)):
          return {"erro": "Uma conta com este mesmo usuário ({}) ja existe!".format(usuario), "tipo_erro": "validacao"}, 400
        
        if len(Perfil.objects.filter(cpf=cpf)) and cpf != '':
          return {"erro": "Uma conta com este mesmo cpf ({}) ja existe!".format(cpf), "tipo_erro": "validacao"}, 400
        
        u_obj = User()
        u_obj.username = usuario
        u_obj.first_name = nome
        u_obj.last_name = sobrenome
        u_obj.email = email
        u_obj.username = usuario
        u_obj.set_password(senha)

        u_obj.save()

        #arquivo = ''
        #if request.FILES.get('foto', None) is not None:
        #  extensao = request.FILES['foto'].name.split('.')[-1]
        #  nome = 'foto_perfil_{}.{}'.format(u_obj.id, extensao)
        #  dirpath = os.path.join(settings.UPLOAD_ROOT, 'usuarios')
        #  arquivo = upload_file(request.FILES['foto'], nome, dirpath)

        p_obj = Perfil()
        p_obj.user = u_obj
        p_obj.cpf = cpf
        #p_obj.foto_perfil = arquivo

        p_obj.save()
        
        if grupo is not None:
          Group.objects.get(pk=grupo)
          u_obj.groups.add(grupo)

      return {'id': u_obj.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def atualizar(request, id):
    try:
      post_data = json.loads(request.body)

      with transaction.atomic():
        usuario = post_data.get('usuario', None)
        senha = post_data.get('senha', None)
        nome = post_data.get('nome', '')
        sobrenome = post_data.get('sobrenome', '')
        email = post_data.get('email', '')
        grupo = post_data.get('grupo', None)
        cpf = post_data.get('cpf', '')

        if len(User.objects.filter(~Q(pk=id), username=usuario)):
          return {"erro": "Uma conta com este mesmo usuário ({}) ja existe!".format(usuario), "tipo_erro": "validacao"}, 400
        
        if len(Perfil.objects.filter(~Q(user__id=id), cpf=cpf)) and cpf != '':
          return {"erro": "Uma conta com este mesmo cpf ({}) ja existe!".format(cpf), "tipo_erro": "validacao"}, 400
        
        u_obj = User.objects.get(pk=id)
        u_obj.username = usuario
        u_obj.first_name = nome
        u_obj.last_name = sobrenome
        u_obj.email = email
        u_obj.username = usuario
        
        if senha != '':
          u_obj.set_password(senha)

        u_obj.save()

        p_obj = Perfil.objects.filter(user=u_obj)
        if len(p_obj):
          p_obj = p_obj.first()
        else:
          p_obj = Perfil()
          p_obj.user = u_obj
        p_obj.cpf = cpf
        p_obj.save()

        u_obj.groups.clear()
        if grupo is not None:
          Group.objects.get(pk=grupo)
          u_obj.groups.add(grupo)
      return {'id': u_obj.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def atualizar_foto(request, id):
    pass

  @staticmethod
  def deletar_foto(request, id):
    try:
      perfil = Perfil.objects.get(user=User.objects.get(pk=id))

      if perfil.foto_perfil != '':
        os.remove(os.path.join(settings.UPLOAD_ROOT, 'usuarios', perfil.foto_perfil))

      perfil.foto_perfil = ''
      perfil.save()
      return {'msg': 'Foto deletada!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def ativar_desativar(request, id):
    try:
      
      u = User.objects.get(pk=id)
      if u.is_active:
        u.is_active = False
        msg = 'Usuário desativado!'
      else:
        u.is_active = True
        msg = 'Usuário ativado!'
      
      u.save(update_fields=['is_active'])
      
      return {'msg': msg}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def deletar(request, id):
    try:
      with transaction.atomic():
        u_obj = User.objects.get(pk=id)
        u_obj.delete()
      return {'msg': 'Usuário deletado!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500
  
  @staticmethod
  def buscar(request):
    try:
      nome = request.GET.get('nome', '')

      dados = User.objects.select_related().filter(
        Q(username__icontains=nome) | Q(first_name__icontains=nome) | Q(last_name__icontains=nome),
        is_superuser=False
      )

      d_json = []
      for d in dados:
        grupos = []
        grupos_id = []

        for grupo in d.groups.all():
          grupos.append(grupo.name)
          grupos_id.append(grupo.id)

        d_json.append({
          'id': d.id,
          'usuario': d.username,
          'nome': d.first_name,
          'sobrenome': d.last_name,
          'email': d.email,
          'ativo': d.is_active,
          'grupos': grupos,
          'grupos_id': grupos_id
        })

      return {'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def trocar_senha(request):
    try:

      post_data = json.loads(request.body)
      senha = post_data.get('senha', None)

      request.user.set_password(senha)
      request.user.save()

      return {'msg': 'A senha foi trocada com sucesso!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

class ProfessorSrv():
  
  @staticmethod
  def listar(request):
    try:

      if f_usuario_possui_grupo(request.user, 'PROFESSOR') and request.user.is_superuser is False:
        dados = User.objects.select_related().filter(pk=request.user.id)
      else:
        dados = User.objects.select_related().filter(groups__tipo_grupo__tipo='PROFESSOR')

      d_json = []
      for dado in dados:
        d_json.append({
          'id': dado.id, 'usuario': dado.username,
          'nome': f_nome_usuario(dado)
        })

      return {'dados': d_json}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def ver_horarios(request, id):
    pass

class PacoteSrv():

  @staticmethod
  def listar(request):
    try:
      dados = Pacote.objects.values('id', 'nome', 'qtd_aulas_semana', 'qtd_participantes', 'valor', 'ativo').all()
      return {'dados': list(dados)}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def ver(request, id):
    try:
      dados = Pacote.objects.values('id', 'nome', 'qtd_aulas_semana', 'qtd_participantes', 'valor', 'ativo').get(pk=id)
      return {'dados': dados}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500
  
  @staticmethod
  def criar(request):
    try:
      post_data = json.loads(request.body)

      pacote_obj = Pacote()
      pacote_obj.nome = post_data.get('nome', None)
      pacote_obj.valor = post_data.get('valor', None)
      pacote_obj.qtd_aulas_semana = post_data.get('qtd_aulas_semana', None)
      pacote_obj.qtd_participantes = post_data.get('qtd_participantes', None)
      pacote_obj.ativo = post_data.get('ativo', None)

      pacote_obj.full_clean()
      pacote_obj.save()
      
      return {'id': pacote_obj.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500
    
  @staticmethod
  def atualizar(request, id):
    try:
      post_data = json.loads(request.body)
     
      pacote_obj = Pacote.objects.get(pk=id)
      pacote_obj.nome = post_data.get('nome', None)
      pacote_obj.qtd_aulas_semana = post_data.get('qtd_aulas_semana', None)
      pacote_obj.qtd_participantes = post_data.get('qtd_participantes', None)
      pacote_obj.ativo = post_data.get('ativo', None)

      pacote_obj.full_clean()
      pacote_obj.save()
      
      return {'id': pacote_obj.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500
    
  @staticmethod
  def deletar(request, id):
    try:
      pacote_obj = Pacote.objects.get(pk=id)
      pacote_obj.delete()

      return {'msg': 'O registro foi deletado com sucesso!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

class AlunoSrv():
  
  @staticmethod
  def ver(request, id):
    try:
      dados = Aluno.objects.values('id', 'nome', 'cpf', 'celular', 'email', 'ativo').get(pk=id)

      return {'dados': dados}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def buscar(request):
    try:
      dados = Aluno.objects.values('id', 'nome', 'cpf', 'celular', 'email', 'ativo').all()

      d_json = []
      for dado in dados:
        d_json.append(dado)

      return {'dados': d_json}, 200
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def criar(request):
    try:
      post_data = json.loads(request.body)
      obj = Aluno()
      obj.nome = post_data.get('nome', None)
      obj.cpf = post_data.get('cpf', None)
      obj.celular = post_data.get('celular', None)
      obj.email = post_data.get('email', None)
      obj.ativo = post_data.get('ativo', None)

      obj.full_clean()
      obj.save()

      return {'id': obj.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def atualizar(request, id):
    try:
      post_data = json.loads(request.body)
      obj = Aluno.objects.get(pk=id)
      obj.nome = post_data.get('nome', None)
      obj.cpf = post_data.get('cpf', None)
      obj.celular = post_data.get('celular', None)
      obj.email = post_data.get('email', None)
      obj.ativo = post_data.get('ativo', None)

      obj.full_clean()
      obj.save()

      return {'id': obj.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def deletar(request, id):
    try:
      obj = Aluno.objects.get(pk=id)
      obj.delete()

      return {'msg': 'O registro foi deletado com sucesso!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

class PacoteAlunoSrv():
  @staticmethod
  def listar(request):
    pass

  @staticmethod
  def ver(request, id):
    pass

  @staticmethod
  def criar(request):
    pass

  @staticmethod
  def atualizar(request, id):
    pass

  @staticmethod
  def deletar(request, id):
    pass

class AgendaSrv():
  
  '''
    -----------Reservar dias/horarios que não podem ser agendados (feriados, torneios, etc...)-----------
  '''
  @staticmethod
  def criar_reserva_especial(request):
    try:
      post_data = json.loads(request.body)

      with transaction.atomic():
        data = post_data.get('data', None)
        hora_ini = post_data.get('hora_ini', '00:00')
        hora_fim = post_data.get('hora_fim', '23:59')

        obj_r = DiaReservado()
        obj_r.descricao = post_data.get('descricao', '')
        obj_r.dia_inteiro = post_data.get('dia_inteiro', None)

        obj_a = Agenda()
        obj_a.data = data
        obj_a.data_horario_ini = conveter_datahorario(data, hora_ini)
        obj_a.data_horario_fim = conveter_datahorario(data, hora_fim)
        obj_a.reserva_especial = obj_r

        if obj_a.existe() is False:
          obj_r.full_clean()
          obj_r.save()

          obj_r.full_clean()
          obj_a.save()
        else:
          return {'msg': 'Um registro com esta data/horário já existe!'}, 400
      
      return {'id': obj_r.id}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  @staticmethod
  def deletar_reserva_especial(request, id):
    try:
      with transaction.atomic():
        obj_r = DiaReservado.objects.filter(pk=id)
        obj_a = Agenda.objects.filter(reserva_especial=obj_r)

        obj_a.delete()
        obj_r.delete()
        
      return {'msg': 'Registro deletado com sucesso!'}, 200
    except ObjectDoesNotExist  as e:
      return {"erro": "O registro não foi encontrado!", "e": str(e), "tipo_erro": "validacao"}, 400
    except ValidationError as e:
      return {"erro":  str(e), "tipo_erro": "validacao"}, 400
    except Exception as e:
      return {"erro": str(e), "tipo_erro": "servidor"}, 500

  '''
    -----------Reservas normais-----------
  '''
