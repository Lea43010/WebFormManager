export default function StartupTest() {
  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "0 auto", 
      padding: "2rem 1rem" 
    }}>
      <h1 style={{ 
        fontSize: "2rem", 
        fontWeight: "bold", 
        marginBottom: "1.5rem" 
      }}>
        Startup Test
      </h1>
      
      <div style={{ 
        border: "1px solid #e2e8f0", 
        borderRadius: "0.5rem", 
        padding: "1.5rem", 
        marginBottom: "1.5rem", 
        background: "white" 
      }}>
        <h2 style={{ 
          fontSize: "1.25rem", 
          fontWeight: "bold", 
          marginBottom: "0.5rem" 
        }}>
          Server Status
        </h2>
        
        <div style={{ 
          padding: "1rem", 
          border: "1px solid #e2e8f0", 
          borderRadius: "0.375rem", 
          background: "#f8fafc" 
        }}>
          <p style={{ marginBottom: "1rem" }}>
            Diese Seite dient zum Testen, ob der Server korrekt startet.
            Sie enthält keine komplexen Komponenten oder API-Aufrufe.
          </p>
          
          <button 
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.25rem",
              fontWeight: "500",
              border: "none",
              cursor: "pointer"
            }}
          >
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
}