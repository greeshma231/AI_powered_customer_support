import { useEffect, useState } from "react";
import "./TicketForm.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const emptyFormData = {
  name: "",
  email: "",
  issueDescription: "",
};

function TicketForm({ user }) {
  const [formData, setFormData] = useState({
    ...emptyFormData,
    name: user?.name || "",
    email: user?.email || "",
  });
  const [attachedImage, setAttachedImage] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData((previousData) => ({
      ...previousData,
      name: user?.name || "",
      email: user?.email || "",
    }));
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Unable to read the selected image."));
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const attachmentDataUrl = attachedImage ? await fileToDataUrl(attachedImage) : "";
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          attachmentName: attachedImage?.name || "",
          attachmentDataUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit ticket.");
      }

      setSubmitted(true);
      setFormData({
        ...emptyFormData,
        name: user?.name || "",
        email: user?.email || "",
      });
      setAttachedImage(null);
    } catch (error) {
      setSubmitted(false);
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (event) => {
    const [file] = event.target.files;
    setAttachedImage(file ?? null);
  };

  return (
    <>
      <form className="ticket-form" onSubmit={handleSubmit}>
        <label className="ticket-form__field">
          <span>Name</span>
          <input
            className="ticket-form__input"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className="ticket-form__field">
          <span>Email</span>
          <input
            className="ticket-form__input"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>

        <label className="ticket-form__field">
          <span>Issue Description</span>
          <textarea
            className="ticket-form__input ticket-form__textarea"
            name="issueDescription"
            value={formData.issueDescription}
            onChange={handleChange}
            required
            rows="4"
          />
        </label>

        <label className="ticket-form__field">
          <span>Attach Image</span>
          <input
            className="ticket-form__input ticket-form__file-input"
            type="file"
            name="attachment"
            accept="image/*"
            onChange={handleImageChange}
          />
          <small className="ticket-form__hint">
            {attachedImage
              ? `Selected: ${attachedImage.name}`
              : "Upload a screenshot or photo related to the issue."}
          </small>
        </label>

        <button className="ticket-form__button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Ticket"}
        </button>

        {errorMessage && <p className="ticket-form__error">{errorMessage}</p>}
      </form>

      {submitted && (
        <p className="ticket-form__success">Ticket submitted successfully.</p>
      )}
    </>
  );
}

export default TicketForm;
