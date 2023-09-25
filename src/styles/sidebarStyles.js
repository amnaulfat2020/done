const sidebarStyles = {
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px',
    },
    logo: {
      width: '100px',
      height: '110px',
      marginRight: '-90px',
      marginLeft: '-30px',
    },
    tagline: {
      margin: '0',
      color: '#000',
      font: 'Roboto',
      fontSize: '20px',
      fontStyle: 'normal',
      fontWeight: '700',
      lineHeight: 'normal',
      marginRight: '1000',
    },
    indentIcon: {
      marginLeft: '38px', 
    },
    logoutButtonContainer: {
      position: 'absolute',
      bottom: '100px',
      left: '50px',
    },
    
    '@media (max-width: 768px)': {
      drawer: {
        width: '80%', // Adjust the width for tablet screens
      },
      logoContainer: {
        padding: '10px 20px', // Adjust padding for tablet screens
      },
      // Adjust any other styles as needed for tablet screens
    },
  
    '@media (max-width: 576px)': {
      drawer: {
        width: '100%', // Adjust the width for mobile screens
      },
      logoContainer: {
        padding: '10px 10px', // Adjust padding for mobile screens
      },
      // Adjust any other styles as needed for mobile screens
    },
  
  };
  
  
  
  export default sidebarStyles;