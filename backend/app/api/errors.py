from fastapi import HTTPException, status


class NotImplementedErrorResponse(HTTPException):
    def __init__(self, feature: str, detail: str | None = None):
        message = detail or f"{feature} is not implemented yet."
        super().__init__(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail={
                "status": "not_implemented",
                "message": message,
                "feature": feature,
            },
        )


def not_implemented(feature: str, detail: str | None = None) -> HTTPException:
    return NotImplementedErrorResponse(feature, detail)
