from .services import log_request_action


class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        try:
            log_request_action(request, response)
        except Exception:
            # Never block API response because of logging failure.
            pass
        return response

