import os

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

from api.middleware.websocket_jwt_auth_middleware import JWTAuthMiddleware
from config.routing import websocket_urlpatterns

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(  # Changed from AuthMiddlewareStack
                URLRouter(websocket_urlpatterns)
            )
        ),
    }
)
