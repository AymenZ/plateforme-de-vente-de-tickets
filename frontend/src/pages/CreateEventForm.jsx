import React, { useState, useEffect, useRef } from "react";
import { eventFormTemplate, eventCategories } from "../data/mockData";
import "../styles/createEvent.css";
import { 
  FaInfoCircle, FaCalendarAlt, FaTicketAlt, FaImage, FaTrash
} from "react-icons/fa";

const TOTAL_STEPS = 4;

function CreateEventForm({ onCancel, onAddEvent, initialData }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialData || eventFormTemplate);
  const [errors, setErrors] = useState({});
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [imagePreview, setImagePreview] = useState(formData.image || null);
  const fileInputRef = useRef();
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
     IMAGE UPLOAD & PREVIEW
  ================================*/
  const handleImageChange = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageChange(file);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  /* ===============================
     SUBMIT
  ================================*/
  const handlePublish = () => {
  if (formData.ticketTiers.some(t => !t.name)) {
    alert("Tous les tickets doivent avoir un nom !");
    return;
  }

  const eventId = Date.now();
  const newEvent = {
    ...formData,
    id: eventId,
    status: "Publié",
    ticketsSold: 0,
    revenue: 0,
    createdAt: new Date().toISOString(),
    tickets: formData.ticketTiers.map((t) => ({
      id: `${eventId}-${t.name.replace(/\s+/g, "-").toLowerCase()}`,
      name: t.name,
      price: Number(t.price),
      quantity: Number(t.quantity),
    })),
  };

  const existingEvents =
    JSON.parse(localStorage.getItem("organizerEvents")) || [];

  const updatedEvents = [...existingEvents, newEvent];
  localStorage.setItem("organizerEvents", JSON.stringify(updatedEvents));

  if (onAddEvent) {
    onAddEvent(newEvent); // update dashboard immediately
  }

  localStorage.removeItem("eventDraft");

  alert("Événement publié avec succès !");

  resetForm(); // reset form fields
  onCancel(); // close modal
};

  const handleSaveDraft = () => {
  const eventId = Date.now();

  const draftEvent = {
    ...formData,
    id: eventId,
    status: "Brouillon",
    ticketsSold: 0,
    revenue: 0,
    createdAt: new Date().toISOString(),
    tickets: formData.ticketTiers,
  };

  const existingEvents =
    JSON.parse(localStorage.getItem("organizerEvents")) || [];

  const updatedEvents = [...existingEvents, draftEvent];

  localStorage.setItem("organizerEvents", JSON.stringify(updatedEvents));

  if (onAddEvent) {
    onAddEvent(draftEvent);
  }

  alert("Brouillon sauvegardé !");
  
  resetForm();
  onCancel(); //CLOSE MODAL
};

  /* ===============================
     update
  ================================*/
useEffect(() => {
  if (initialData) {
    setFormData({
      ...eventFormTemplate,
      ...initialData,
      ticketTiers: initialData.tickets || eventFormTemplate.ticketTiers,
    });
    if (initialData.image) setImagePreview(initialData.image);
  }
}, [initialData]);

   const handlePublishOrUpdate = () => {
    if (initialData) {
      // editing existing event
      const updatedEvent = {...formData, tickets: formData.ticketTiers,};
      onAddEvent(updatedEvent); // call handleEditSubmit in parent
      alert("Événement modifié avec succès !");
    } else {
      // creating new event
      handlePublish();
    }
    onCancel();
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
          <label>Image</label>
          <div
            className="drag-drop-area"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="image-preview"/>
            ) : (
              <p>Glissez-déposez votre image ou cliquez ici</p>
            )}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={(e) => handleImageChange(e.target.files[0])}
            />
          </div>
        </div>
      )}

      {/* FOOTER BUTTONS */}
      <div className="form-actions">
        {currentStep > 1 && <button onClick={prevStep} className="btn-secondary">Précédent</button>}
        {currentStep < TOTAL_STEPS && <button onClick={nextStep} className="btn-primary">Suivant</button>}
        {currentStep === TOTAL_STEPS && (
          <>
          {!initialData && (
          <button onClick={handleSaveDraft} className="btn-secondary">
            Sauvegarder en brouillon
          </button>
          )}
    <button onClick={handlePublishOrUpdate} className="btn-primary">
      {initialData ? "Modifier" : "Publier"}
    </button>
  </>
)}
        <button onClick={onCancel} className="btn-danger">Annuler</button>
      </div>
    </div>
  );
}

export default CreateEventForm;