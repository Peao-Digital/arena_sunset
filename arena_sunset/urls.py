from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf import settings

admin.site.site_header = 'Administração | Arena Sunset'

urlpatterns = [
  path('admin/', admin.site.urls),

  path('backend/', include('backend.urls')),
  path('', include('frontend.urls')),
] + static(settings.UPLOAD_URL, document_root=settings.UPLOAD_ROOT)