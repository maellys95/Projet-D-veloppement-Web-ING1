import React from "react";
import "./css/Contact.css";

function Contact() {
    return (
        <div className="contact-page">
            <h1>Contactez-nous</h1>
            <p>
                Une question sur les réservations, les salles connectées ou les objets IoT ?
                Notre équipe SmartCampus est disponible.
            </p>

            <div className="contact-container">

                <div className="contact-info">
                    <h2>Informations</h2>
                    <p><strong>Email :</strong> cy.smartcampus@gmail.com</p>
                    <p><strong>Téléphone :</strong> +33 1 34 25 10 10</p>
                    <p><strong>Adresse :</strong> CY Tech, Avenue du Parc, Cergy</p>
                </div>

                <div className="contact-form">
                    <h2>Envoyer un message</h2>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();

                            const name = e.target.name.value;
                            const email = e.target.email.value;
                            const message = e.target.message.value;

                            const subject = encodeURIComponent("Message depuis SmartCampus");
                            const body = encodeURIComponent(
                                `Nom : ${name}\nEmail : ${email}\n\nMessage :\n${message}`
                            );

                            window.location.href = `mailto:cy.smartcampus@gmail.com?subject=${subject}&body=${body}`;
                        }}
                    >
                        <input name="name" type="text" placeholder="Votre nom" required />
                        <input name="email" type="email" placeholder="Votre email" required />
                        <textarea name="message" placeholder="Votre message" required></textarea>

                        <button type="submit">Envoyer</button>
                    </form>
                </div>

            </div>
        </div>
    );
}

export default Contact;