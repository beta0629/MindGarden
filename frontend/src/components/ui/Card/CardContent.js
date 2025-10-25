import React from 'react';

const CardContent = ({children, 
  className = '',
  ...props}) => {return (<div
      className={`mg-v2-card-content ${className}`.trim()}
      {...props}
    >
      {children}
    </div>);};

export default CardContent;