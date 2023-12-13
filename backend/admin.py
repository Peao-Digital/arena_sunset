from django.contrib import admin
from django.contrib.auth.admin import (UserAdmin, GroupAdmin)
from django.contrib.auth.models import (User, Group)

from .constants import Opcoes
from .models import *

'''
  Usuário/Perfil
'''
class PerfilInline(admin.StackedInline):
  model = Perfil
class UserAdmin(UserAdmin):
  list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff','is_active')
  list_filter = ('is_active', 'is_staff','is_superuser')
  inlines = [PerfilInline,]

'''
  Grupo/TipoGrupo
'''
class TipoGrupoInline(admin.StackedInline):
  model = TipoGrupo
class GroupAdmin(GroupAdmin):
  list_display = ('id', 'name', 'get_tipo')
  list_filter = ('tipo_grupo__tipo',)
  inlines = [ TipoGrupoInline, ]

  class Media:
    css = {
      "all": ["backend/css/form_grupo.css"],
    }

  @admin.display(ordering="tipo_grupo",description='Tipo')
  def get_tipo(self, obj):
    return Opcoes.get_desc(Opcoes.TIPO_GRUPO, obj.tipo_grupo.tipo)

admin.site.unregister(Group)
admin.site.register(Group, GroupAdmin)

admin.site.unregister(User)
admin.site.register(User, UserAdmin)

admin.site.register(Aluno)
admin.site.register(Pacote)

admin.site.register(AlunoPacote)

admin.site.register(Aula)
admin.site.register(AulaParticipante)

admin.site.register(Reserva)
admin.site.register(DiaReservado)
