import React from 'react';

const Footer = () => {
  return (
    <footer className={' footer bg-green-500/20 text-center backdrop-blur-md font-primary px-4 py-16 rounded-t-2xl shadow-lg '}>
      <div>
        <p>&copy; {new Date().getFullYear()} Eden. All Rights Reserved.</p>
        <nav>
          <a href="/privacypolicy" style={{ margin: '0 10px' }}>Privacy Policy</a>
          <a href="/about" style={{ margin: '0 10px' }}>About Us</a>
          <a href="/contact" style={{ margin: '0 10px' }}>Contact</a>
        </nav>
      </div>
      <div style={{ marginTop: '10px' }}>
        <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" style={{ margin: '0 10px' }}>Facebook</a>
        <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" style={{ margin: '0 10px' }}>Twitter</a>
        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" style={{ margin: '0 10px' }}>Instagram</a>
      </div>
      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ marginRight: '10px' }}>Developed by</p>
        <img src="/eden.svg" alt="Eden Logo" style={{ width: '150px', height: 'auto' }} />
        <p style={{ marginLeft: '10px' }}>AgroTechnologies</p>
      </div>
    </footer>
  );
};

export default Footer;
