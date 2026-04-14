import { useEffect, useState } from "react";
import TicketForm from "../../components/ticket-form/TicketForm";
import "./DashboardPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function DashboardPage({ user, onLogout }) {
  const isAdmin = user?.email === "admin";
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketsError, setTicketsError] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const fetchTickets = async () => {
      try {
        setIsLoadingTickets(true);
        setTicketsError("");

        const response = await fetch(`${API_URL}/api/tickets`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to fetch tickets.");
        }

        setTickets(data.tickets || []);
      } catch (error) {
        setTicketsError(error.message);
      } finally {
        setIsLoadingTickets(false);
      }
    };

    fetchTickets();
  }, [isAdmin]);

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__panel">
        <header className="dashboard-page__header">
          <div>
            <p className="dashboard-page__eyebrow">Support console</p>
            <h1>{isAdmin ? "Admin Ticket Dashboard" : "Customer Support Dashboard"}</h1>
            <p className="dashboard-page__copy">
              {isAdmin
                ? `Logged in as ${user.name}. Review all submitted support tickets below.`
                : `Logged in as ${user.name}. Create a new support ticket below.`}
            </p>
          </div>

          <button className="dashboard-page__logout" onClick={onLogout} type="button">
            Log Out
          </button>
        </header>

        {isAdmin ? (
          <section className="dashboard-page__tickets">
            {isLoadingTickets && <p className="dashboard-page__state">Loading tickets...</p>}

            {ticketsError && <p className="dashboard-page__state dashboard-page__state--error">{ticketsError}</p>}

            {!isLoadingTickets && !ticketsError && tickets.length === 0 && (
              <p className="dashboard-page__state">No tickets raised yet.</p>
            )}

            {!isLoadingTickets && !ticketsError && tickets.length > 0 && (
              <div className="dashboard-page__ticket-list">
                {tickets.map((ticket) => (
                  <article className="dashboard-page__ticket" key={ticket.id}>
                    <div className="dashboard-page__ticket-meta">
                      <strong>{ticket.name}</strong>
                      <span>{ticket.email}</span>
                      {ticket.createdAt && <span>{new Date(ticket.createdAt).toLocaleString()}</span>}
                    </div>

                    <div className="dashboard-page__ticket-issue-block">
                      <h3 className="dashboard-page__ticket-issue-title">Issue</h3>
                      <p className="dashboard-page__ticket-description">{ticket.issueDescription}</p>
                    </div>

                    <div className="dashboard-page__ticket-extra">
                      <span>Category: {ticket.category || "pending"}</span>
                      <span>Priority: {ticket.priority || "pending"}</span>
                      <span>Summary: {ticket.summary || ""}</span>
                    </div>

                    {ticket.attachmentDataUrl && (
                      <div className="dashboard-page__ticket-attachment">
                        <p>{ticket.attachmentName || "Attached Image"}</p>
                        <img
                          src={ticket.attachmentDataUrl}
                          alt={ticket.attachmentName || "Ticket attachment"}
                          onClick={() => setSelectedImage(ticket.attachmentDataUrl)}
                        />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <TicketForm user={user} />
        )}
      </div>

      {selectedImage && (
        <div className="dashboard-page__image-modal" onClick={() => setSelectedImage("")}>
          <img className="dashboard-page__image-modal-content" src={selectedImage} alt="Ticket preview" />
        </div>
      )}
    </section>
  );
}

export default DashboardPage;