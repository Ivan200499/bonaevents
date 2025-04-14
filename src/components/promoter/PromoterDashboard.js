import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../common/Header';
import TicketHistory from '../tickets/TicketHistory';
import SellTicketModal from '../tickets/SellTicketModal';
import EventCard from './EventCard';
import { FaTicketAlt, FaEuroSign } from 'react-icons/fa';
import './PromoterDashboard.css';

function PromoterDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalTickets: 0,
    totalCommissions: 0
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateItem, setSelectedDateItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSellTicket = (event, dateItem) => {
    if (!event || !dateItem) return;
    setSelectedEvent(event);
    setSelectedDateItem(dateItem);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchEvents()])
        .catch(error => console.error("Errore durante il caricamento iniziale:", error))
        .finally(() => setLoading(false));
  }, [currentUser]);

  async function fetchStats() {
    try {
      const ticketsQuery = query(
        collection(db, 'tickets'),
        where('sellerId', '==', currentUser.uid)
      );
      
      const ticketsSnapshot = await getDocs(ticketsQuery);
      
      const statistics = ticketsSnapshot.docs.reduce((acc, doc) => {
        const ticket = doc.data();
        return {
          totalTickets: acc.totalTickets + (ticket.quantity || 0),
          totalCommissions: (acc.totalCommissions || 0) + (ticket.commissionAmount || 0)
        };
      }, { totalTickets: 0, totalCommissions: 0 });
      
      setStats(statistics);
    } catch (error) {
      console.error('Errore nel recupero delle statistiche:', error);
      throw error;
    }
  }

  async function fetchEvents() {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef /*, where('status', '==', 'active') */);
      const snapshot = await getDocs(q);
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(event => event.eventDates && event.eventDates.length > 0);
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Errore nel recupero degli eventi:', error);
      throw error;
    }
  }

  const handleModalClose = () => {
      setSelectedEvent(null);
      setSelectedDateItem(null);
  };

  const handleSold = () => {
      fetchStats();
      handleModalClose();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Caricamento dashboard...</p>
      </div>
    );
  }

  return (
    <div className="promoter-dashboard">
      <Header />
      <div className="dashboard-header">
        <h1 className="header-title">Dashboard Promoter</h1>
        <p className="header-subtitle">Gestisci i tuoi eventi e monitora le vendite</p>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell')}
        >
          Vendi Biglietti
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="dashboard-content">
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon">
                  <FaTicketAlt />
                </div>
                <div className="stat-info">
                  <h3>Biglietti Venduti</h3>
                  <div className="value">{stats.totalTickets}</div>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon">
                  <FaEuroSign />
                </div>
                <div className="stat-info">
                  <h3>Commissioni Totali</h3>
                  <div className="value">€{stats.totalCommissions.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          <TicketHistory userId={currentUser.uid} />
        </div>
      ) : (
        <div className="sell-tickets-container">
          <h2>Seleziona un Evento e una Data per la Vendita</h2>
          <div className="events-grid">
            {events.length > 0 ? (
                events.map((event) => (
                <EventCard 
                    key={event.id} 
                    event={event} 
                    onSell={handleSellTicket}
                />
                ))
            ) : (
                <p>Nessun evento disponibile al momento.</p>
            )}
          </div>
        </div>
      )}

      {selectedEvent && selectedDateItem && (
        <SellTicketModal
          event={selectedEvent}
          selectedDateItem={selectedDateItem}
          onClose={handleModalClose}
          onSold={handleSold}
        />
      )}
    </div>
  );
}

export default PromoterDashboard; 