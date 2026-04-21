from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, role_required
from app.database import get_db
from app.models.user import User
from app.schemas.order import CheckoutSessionOut, CheckoutSessionSyncIn
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["Paiement"])


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="stripe-signature"),
    db: Session = Depends(get_db),
):
    """Webhook Stripe pour confirmer ou invalider les paiements."""
    payload = await request.body()
    return payment_service.process_webhook_event(
        db=db,
        payload=payload,
        signature_header=stripe_signature,
    )


@router.post("/checkout-session/sync", response_model=CheckoutSessionOut)
def sync_checkout_session(
    payload: CheckoutSessionSyncIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("CLIENT", "ADMIN")),
):
    """Synchroniser l'état d'une session Stripe depuis le frontend (retour success)."""
    return payment_service.sync_checkout_session(
        db=db,
        session_id=payload.session_id,
        current_user=current_user,
    )


@router.get("/health")
def payment_health_check(current_user: User = Depends(get_current_user)):
    """Endpoint léger pour vérifier l'accès aux routes paiement."""
    return {"status": "ok", "user_id": current_user.id}
