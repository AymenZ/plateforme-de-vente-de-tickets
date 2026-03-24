import React, { useState, useEffect } from "react";
import { eventFormTemplate, eventCategories } from "../data/mockData";
import "../styles/createEvent.css";
import { 
  FaInfoCircle, FaCalendarAlt, FaTicketAlt, FaImage, FaTrash, FaLink, FaRegFile
} from "react-icons/fa";

const TOTAL_STEPS = 4;

/**
 * Maps the internal formData to the backend EventCreate / EventUpdate schema.
 * The backend expects snake_case fields.
 */
function toBackendPayload(formData, status) {
  return {
    title: formData.title,
    description: formData.description || null,
    category: formData.category || null,
    date: formData.date,
    time: formData.time || "10:00",
    location: formData.isOnline ? "En ligne" : (formData.location || null),
    image: formData.image || null,
    price: Number(formData.price) || 0,
    capacity: Number(formData.capacity) || 0,
    attendees: 0,
    duration: null,
    age_min: 0,
    extra_info: null,
    status: status,
    tickets: (formData.ticketTiers || []).map((t) => ({
      name: t.name,
      price: Number(t.price),
      quantity: Number(t.quantity),
    })),
  };
}

function CreateEventForm({ onCancel, onAddEvent, initialData }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialData || eventFormTemplate);
  const [errors, setErrors] = useState({});
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [imagePreview, setImagePreview] = useState(formData.image || null);
  const resetForm = () => { setFormData(eventFormTemplate); setErrors({}); setImagePreview(null); setCurrentStep(1);};
  /* ===============================
     AUTO SAVE (every 30 seconds)
  ================================*/
  useEffect(() => {
  const interval = setInterval(handleAutoSave, 30000);
  return () => clearInterval(interval);
}, [formData]);
  
  const handleAutoSave = () => {
    setIsAutoSaving(true);
    localStorage.setItem("eventDraft", JSON.stringify(formData));
    setLastSavedAt(new Date().toLocaleTimeString());
    setTimeout(() => setIsAutoSaving(false), 800);
  };

  /* ===============================
     LOAD DRAFT IF EXISTS
  ================================*/
  useEffect(() => {
    const draft = localStorage.getItem("eventDraft");
    if (draft) {
      const parsed = JSON.parse(draft);
      setFormData(parsed);
      if (parsed.image) setImagePreview(parsed.image);
    }
  }, []);

  /* ===============================
     HANDLE INPUT
  ================================*/
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trimStart(),
    }));
  };


  useEffect(() => {
  const slug = formData.title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
  setFormData(prev => ({ ...prev, slug }));
}, [formData.title]);

  /* ===============================
     STEP VALIDATION
  ================================*/
  const validateStep = () => {
    let newErrors = {};
    if (currentStep === 1) {
      if (!formData.title) newErrors.title = "Titre requis";
      if (!formData.category) newErrors.category = "Catégorie requise";
      if (!formData.description) newErrors.description = "Description requise";
    }
    if (currentStep === 2) {
      if (!formData.date) newErrors.date = "Date requise";
      if (!formData.location && !formData.isOnline)
        newErrors.location = "Lieu requis";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ===============================
     NAVIGATION
  ================================*/
  const nextStep = () => {
    if (!validateStep()) return;
    if (currentStep < TOTAL_STEPS) setCurrentStep((prev) => prev + 1);
  };
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  /* ===============================
     IMAGE URL HANDLER
  ================================*/
  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, image: url }));
    setImagePreview(url);
  };

  /* ===============================
     SUBMIT — calls parent callback which speaks to the API
  ================================*/
  const handlePublish = () => {
    if (formData.ticketTiers.some(t => !t.name)) {
      alert("Tous les tickets doivent avoir un nom !");
      return;
    }

    const payload = toBackendPayload(formData, "Publié");

    if (onAddEvent) {
      onAddEvent(payload);
    }

    localStorage.removeItem("eventDraft");
    resetForm();
  };

  const handleSaveDraft = () => {
    // Save as draft — no validation required, can be called at any step
    const payload = toBackendPayload(formData, "Brouillon");

    if (onAddEvent) {
      onAddEvent(payload);
    }

    localStorage.removeItem("eventDraft");
    resetForm();
  };

  /* ===============================
     update
  ================================*/
useEffect(() => {
  if (initialData) {
    setFormData({
      ...eventFormTemplate,
      ...initialData,
      ticketTiers: (initialData.tickets || []).map((t, i) => ({
        id: t.id || i + 1,
        name: t.name || "",
        price: t.price || 0,
        quantity: t.quantity || 100,
        description: t.description || "",
        endsAt: t.endsAt || null,
      })),
    });
    if (initialData.image) setImagePreview(initialData.image);
  }
}, [initialData]);

  const handlePublishOrUpdate = () => {
    if (formData.ticketTiers.some(t => !t.name)) {
      alert("Tous les tickets doivent avoir un nom !");
      return;
    }
    // Always set status to "Publié" — both for new events and draft→publish
    const payload = toBackendPayload(formData, "Publié");
    if (onAddEvent) {
      onAddEvent(payload);
    }
    localStorage.removeItem("eventDraft");
    resetForm();
  };
  /* ===============================
     Handlers for ticket tiers (STEP 3)
  ================================*/

  const handleTicketChange = (index, field, value) => {
  const updatedTickets = [...formData.ticketTiers];
  updatedTickets[index][field] = field === "price" || field === "quantity" ? Number(value) : value;
  setFormData((prev) => ({ ...prev, ticketTiers: updatedTickets }));
};

const addTicket = () => {
  setFormData((prev) => ({
    ...prev,
    ticketTiers: [
      ...prev.ticketTiers,
      {
        id: Date.now(), // temporary id
        name: "",
        price: 0,
        quantity: 100,
        description: "",
        endsAt: null,
      },
    ],
  }));
};

const removeTicket = (index) => {
  const updatedTickets = [...formData.ticketTiers];
  updatedTickets.splice(index, 1);
  setFormData((prev) => ({ ...prev, ticketTiers: updatedTickets }));
};
  /* ===============================
     RENDER
  ================================*/
  return (
    <div className="create-event-container">
      <div className="create-header">
        <h2>Créer un Événement</h2>

        <div className="stepper-container">
          {[{icon: <FaInfoCircle />, label: "Infos"},
            {icon: <FaCalendarAlt />, label: "Date"},
            {icon: <FaTicketAlt />, label: "Billets"},
            {icon: <FaImage />, label: "Média"}].map((step, index) => (
              <div key={index} className={`step ${currentStep >= index + 1 ? "active" : ""}`}>
                {step.icon}
                <span>{step.label}</span>
              </div>
          ))}

          {/* Animated progress bar */}
          <div
            className="step-progress"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {isAutoSaving && <p className="autosave">Sauvegarde automatique...</p>}
      {lastSavedAt && <p className="lastsaved">Dernière sauvegarde: {lastSavedAt}</p>}

      {/* STEP 1 */}
      {currentStep === 1 && (
        <div className="form-section">
          <label>Titre (max 100)</label>
          <input
            type="text"
            name="title"
            maxLength={100}
            value={formData.title}
            onChange={handleChange}
          />
          {errors.title && <span className="error">{errors.title}</span>}

          <label>Catégorie</label>
          <select name="category" value={formData.category} onChange={handleChange}>
            <option value="">Sélectionner</option>
            {eventCategories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          {errors.category && <span className="error">{errors.category}</span>}

          <label>Description</label>
          <textarea name="description" rows={4} value={formData.description} onChange={handleChange}/>
          {errors.description && <span className="error">{errors.description}</span>}
        </div>
      )}

      {/* STEP 2 */}
      {currentStep === 2 && (
        <div className="form-section">
          <label>Date</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} />
          {errors.date && <span className="error">{errors.date}</span>}
          <label>Heure</label>
          <input type="time" name="time" value={formData.time} onChange={handleChange} />

          <label>
            <input type="checkbox" checked={formData.isOnline} onChange={() =>
              setFormData((prev) => ({ ...prev, isOnline: !prev.isOnline }))
            }/>
            Événement en ligne
          </label>

          {!formData.isOnline && (
            <>
              <label>Lieu</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} />
              {errors.location && (<span className="error">{errors.location}</span>)}
            </>
          )}
        </div>
      )}

 {/* ===== STEP 3 ===== */}
{currentStep === 3 && (
  <div className="form-section">
    <label>Tickets</label>

    {(formData.ticketTiers || []).map((ticket, index) => (
      <div key={ticket.id} className="ticket-row">
        <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
          <label>Nom du ticket</label>
          <input
            type="text"
            placeholder="Nom du ticket"
            value={ticket.name}
            onChange={(e) =>
              handleTicketChange(index, "name", e.target.value)
            }
          />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <label>Prix (TND)</label>
          <input
            type="number"
            min="0"
            placeholder="Prix"
            value={ticket.price}
            onChange={(e) =>
              handleTicketChange(index, "price", e.target.value)
            }
          />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <label>Quantité</label>
          <input
            type="number"
            min="1"
            placeholder="Quantité"
            value={ticket.quantity}
            onChange={(e) =>
              handleTicketChange(index, "quantity", e.target.value)
            }
          />
        </div>

        <button
          type="button"
          className="btn-danger ticket-delete-btn"
          onClick={() => removeTicket(index)}
          aria-label="Supprimer le ticket"
        >
          <FaTrash />
        </button>
      </div>
    ))}

    <button
      type="button"
      className="btn-secondary"
      onClick={addTicket}
    >
      Ajouter un ticket
    </button>
  </div>
)}

      {/* STEP 4 */}
      {currentStep === 4 && (
        <div className="form-section">
          <label><FaLink style={{ marginRight: 6 }} /> Lien de l'image (URL)</label>
          <input
            type="url"
            name="image"
            placeholder="https://images.unsplash.com/photo-..."
            value={formData.image}
            onChange={handleImageUrlChange}
            className="image-url-input"
          />
          {imagePreview && (
            <div className="image-url-preview">
              <img
                src={imagePreview}
                alt="Aperçu"
                onError={(e) => { e.target.style.display = 'none'; }}
                onLoad={(e) => { e.target.style.display = 'block'; }}
              />
            </div>
          )}
          {!imagePreview && (
            <div className="image-url-placeholder">
              <FaImage size={32} color="#ccc" />
              <p>Collez un lien pour voir l'aperçu</p>
            </div>
          )}
        </div>
      )}

      {/* FOOTER BUTTONS */}
      <div className="form-actions">
        {currentStep > 1 && <button onClick={prevStep} className="btn-secondary">Précédent</button>}
        {currentStep < TOTAL_STEPS && <button onClick={nextStep} className="btn-primary">Suivant</button>}

        {/* Draft — available at every step, for both new and editing */}
        <button onClick={handleSaveDraft} className="btn-draft">
          <FaRegFile style={{ marginRight: 4 }} /> Brouillon
        </button>

        {/* Publish / Update — only on last step */}
        {currentStep === TOTAL_STEPS && (
          <button onClick={handlePublishOrUpdate} className="btn-primary">
            {initialData && initialData.status !== "Brouillon" ? "Modifier" : "Publier"}
          </button>
        )}

        <button onClick={onCancel} className="btn-danger">Annuler</button>
      </div>
    </div>
  );
}

export default CreateEventForm;