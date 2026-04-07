import logging
import time

logger = logging.getLogger(__name__)


class LoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()

        initial_user = getattr(request, "user", "Anonymous")
        method = request.method
        path = request.get_full_path()

        logger.info(f"Incoming request: {method} {path} - User: {initial_user}")

        response = self.get_response(request)

        duration = time.time() - start_time
        status_code = response.status_code

        # Ninja populates request.user during the request lifecycle,
        # so we check it again to log the authenticated user.
        resolved_user = getattr(request, "user", "Anonymous")

        logger.info(
            f"Outgoing response: {method} {path} - Status: {status_code} - Duration: {duration:.2f}s - User: {resolved_user}"
        )

        return response
