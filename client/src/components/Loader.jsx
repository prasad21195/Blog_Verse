const Loader = ({ small }) => (
  <div className={`d-flex justify-content-center align-items-center ${small ? 'py-2' : 'py-5'}`}>
    <div className="spinner-border text-primary" style={{ width: small ? '1.5rem' : '2.5rem', height: small ? '1.5rem' : '2.5rem' }} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

export default Loader;
