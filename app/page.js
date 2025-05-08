// app/page.js
import Link from 'next/link';

export default function Home() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Daycare Management</h1>
          <p>Providing quality childcare services for your peace of mind</p>
          <div className="hero-buttons">
            <Link href="/program">
              <button className="primary-btn">Explore Programs</button>
            </Link>
            <Link href="/contact">
              <button className="secondary-btn">Contact Us</button>
            </Link>
          </div>
        </div>
      </section>
      
      <section className="features-section">
        <h2>Why Choose Us</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👨‍👩‍👧‍👦</div>
            <h3>Qualified Staff</h3>
            <p>Our team consists of experienced and certified childcare professionals</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🏫</div>
            <h3>Safe Environment</h3>
            <p>We maintain a clean, secure, and nurturing environment for all children</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Educational Programs</h3>
            <p>Age-appropriate activities to foster learning and development</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🍎</div>
            <h3>Nutritious Meals</h3>
            <p>Balanced and healthy meals prepared daily for growing minds and bodies</p>
          </div>
        </div>
      </section>
      
      <section className="programs-preview">
        <h2>Our Programs</h2>
        <div className="programs-grid">
          <div className="program-card">
            <h3>Infant Care</h3>
            <p>Ages: 3-18 months</p>
            <Link href="/program#infant">
              <button className="learn-more-btn">Learn More</button>
            </Link>
          </div>
          
          <div className="program-card">
            <h3>Toddler Program</h3>
            <p>Ages: 18-36 months</p>
            <Link href="/program#toddler">
              <button className="learn-more-btn">Learn More</button>
            </Link>
          </div>
          
          <div className="program-card">
            <h3>Preschool</h3>
            <p>Ages: 3-5 years</p>
            <Link href="/program#preschool">
              <button className="learn-more-btn">Learn More</button>
            </Link>
          </div>
          
          <div className="program-card">
            <h3>After-School Care</h3>
            <p>Ages: 5-12 years</p>
            <Link href="/program#afterschool">
              <button className="learn-more-btn">Learn More</button>
            </Link>
          </div>
        </div>
      </section>
      
      <section className="testimonials">
        <h2>What Parents Say</h2>
        <div className="testimonials-slider">
          <div className="testimonial">
            <p>"The staff at Daycare Management have been amazing with our daughter. She loves going there every day!"</p>
            <div className="testimonial-author">- Sarah M., Parent</div>
          </div>
          
          <div className="testimonial">
            <p>"We've seen tremendous growth in our son's social skills since he started at this daycare. Highly recommend!"</p>
            <div className="testimonial-author">- Michael T., Parent</div>
          </div>
          
          <div className="testimonial">
            <p>"The regular updates and easy payment system make this daycare perfect for busy parents."</p>
            <div className="testimonial-author">- Jennifer K., Parent</div>
          </div>
        </div>
      </section>
      
      <section className="cta-section">
        <h2>Ready to Join Our Daycare Family?</h2>
        <p>Spaces fill up quickly. Contact us today to schedule a tour or register your child.</p>
        <div className="cta-buttons">
          <Link href="/auth/signup">
            <button className="primary-btn">Register Now</button>
          </Link>
          <Link href="/contact">
            <button className="secondary-btn">Schedule a Tour</button>
          </Link>
        </div>
      </section>
    </div>
  );
}