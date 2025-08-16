import './InputField.css';

const InputField = ({ label, type, name, register, errors, placeholder, value, onChange, id }) => {
  const inputId = id || name;
  const hasError = errors && name && errors[name];

  return (
    <div className="input-field-container">
      <label className="input-label" htmlFor={inputId}>
        {label}
      </label>
      <input 
        id={inputId}
        type={type} 
        name={name} 
        placeholder={placeholder} 
        // react-hook-form registration if provided
        {...(register ? register(name) : {})}
        // controlled props if provided
        value={value !== undefined ? value : undefined}
        onChange={onChange}
        className={`input-field ${hasError ? 'input-error' : ''}`}
      />
      {hasError && (
        <p className="error-message">{errors[name]?.message}</p>
      )}
    </div>
  );
};

export default InputField;
