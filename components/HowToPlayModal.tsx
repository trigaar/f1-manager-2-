
import React from 'react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xl font-bold text-red-500 mb-2 border-b-2 border-red-500/30 pb-1">{title}</h3>
    <div className="space-y-2 text-gray-300 text-sm leading-relaxed">{children}</div>
  </div>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-4 bg-gray-900/50 p-3 rounded-md">
        <h4 className="text-md font-bold text-white mb-2">{title}</h4>
        <div className="space-y-1 text-xs">{children}</div>
    </div>
);

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-white">How to Play</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="p-6">
            <Section title="Welcome, Team Principal!">
                <p>Your goal is to lead an F1 team to glory. You'll make crucial decisions during the off-season, then watch your strategy unfold during the simulated race weekends. Success requires a blend of smart financial planning, technical investment, and shrewd driver management.</p>
            </Section>

            <Section title="The Game Loop">
                <p>The game flows in a yearly cycle:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Race Weekends:</strong> Progress through the season, one race at a time. Each weekend consists of Practice, Qualifying, and the Race.</li>
                    <li><strong>Off-Season:</strong> After the final race, the off-season begins. This is where you make your key management decisions to prepare for the next championship.</li>
                    <li><strong>New Season:</strong> Once the off-season is complete, a new season begins with updated cars, drivers, and personnel.</li>
                </ul>
            </Section>
            
            <Section title="The Off-Season: Your Management Hub">
                <p>This is where you shape your team's future. The phases are:</p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <li><strong>Debrief:</strong> Review the past season. Key metrics like <b className="text-teal-400">Team Prestige Rating (TPR)</b> and <b className="text-yellow-400">Driver Stock Value (DSV)</b> are calculated, influencing the market.</li>
                    <li><strong>Driver Progression:</strong> Your drivers' skills will evolve based on their age and performance. Young talents may improve, while veterans might decline.</li>
                    <li><strong>Financials:</strong> Prize money is awarded based on your constructor's championship position. This forms your budget for the next year.</li>
                    <li><strong>Resource Allocation:</strong> <b className="text-white">Your most important decision.</b> Allocate your total budget between Car Development, Driver Salaries, and Personnel/Facilities. A balanced approach is key!</li>
                    <li><strong>Personnel Management:</strong> Hire and fire your Team Principal and Head of Technical. You can also sign a young Affiliate Driver to your junior program.</li>
                    <li><strong>Driver Market:</strong> The "Silly Season"! Sign free agents or rookies to fill your two race seats. Be mindful of your Driver Acquisition Fund.</li>
                    <li><strong>Car Development:</strong> Spend your allocated Car Development budget to improve your car's attributes for the upcoming season. Your Head of Technical's skills are crucial here.</li>
                </ul>
            </Section>

             <Section title="Understanding Your Assets">
                <p>Your success depends on the quality of your drivers, car, and staff. Here's what their stats mean:</p>
                <SubSection title="Driver Skills">
                    <p><b>Overall:</b> A summary of the driver's core abilities.</p>
                    <p><b>Qualifying Pace:</b> Determines one-lap speed and performance in qualifying sessions.</p>
                    <p><b>Racecraft:</b> Skill in wheel-to-wheel combat, affecting both attacking and defending.</p>
                    <p><b>Tyre Management:</b> Reduces tyre wear during a race, allowing for longer stints.</p>
                    <p><b>Consistency:</b> Reduces the chance of making small mistakes like lock-ups or running wide.</p>
                    <p><b>Wet Weather Skill:</b> Improves performance and reduces incident risk in rainy conditions.</p>
                    <p><b>Aggression Index:</b> A higher value means the driver will attempt more risky overtakes.</p>
                    <p><b>Incident Proneness:</b> A measure of how likely a driver is to cause a major incident or crash.</p>
                    <p><b>Loyalty:</b> Affects a driver's willingness to re-sign with your team, even if better offers exist.</p>
                    <p><b>Potential:</b> A hidden stat that determines a young driver's skill ceiling during progression.</p>
                </SubSection>
                 <SubSection title="Driver Traits">
                    <p>Traits are powerful, unique abilities that give drivers a distinct edge. They have a direct impact on the simulation and are a key part of a driver's identity.</p>
                    <p>Traits come in three rarities:</p>
                    <ul className="list-disc list-inside pl-2 text-xs">
                        <li><b className="text-gray-300">Common:</b> Minor but useful bonuses (e.g., 'Mr. Consistent').</li>
                        <li><b className="text-blue-400">Rare:</b> Significant advantages in specific scenarios (e.g., 'Rain Master', 'Mr. Saturday').</li>
                        <li><b className="text-yellow-400">Legendary:</b> Game-changing abilities that define a driver's style (e.g., 'The Overtaker', 'Tyre Whisperer').</li>
                    </ul>
                    <p className="mt-2">Building a driver pairing with complementary traits can be a powerful strategy.</p>
                </SubSection>
                 <SubSection title="Car Attributes">
                    <p><b>Overall Pace:</b> The car's general speed, derived from its other attributes.</p>
                    <p><b>High/Medium/Low Speed Cornering:</b> Performance in different corner types. Crucial for matching your car to a specific track's layout.</p>
                    <p><b>Power Sensitivity:</b> Performance on long straights. Essential for tracks like Monza or Baku.</p>
                    <p><b>Reliability:</b> Reduces the chance of mechanical failures during a race.</p>
                    <p><b>Tyre Wear Factor:</b> How kind the car is on its tyres. Higher is better.</p>
                </SubSection>
                 <SubSection title="Personnel Skills">
                    <p><b>Team Principal - Negotiation:</b> Influences poaching success in the staff market.</p>
                    <p><b>Team Principal - Financial Acumen:</b> Increases the efficiency of your car development budget.</p>
                    <p><b>Team Principal - Leadership:</b> Improves the accuracy of your team's weather forecasts.</p>
                    <p><b>Head of Technical - R&D Conversion:</b> Determines how effectively your budget is turned into Development Points (DP).</p>
                    <p><b>Head of Technical - Innovation:</b> Increases the chance of a major R&D breakthrough during car development.</p>
                </SubSection>
                 <SubSection title="Personnel Traits">
                    <p>Traits are unique passive bonuses that your key staff provide. They can have powerful effects, such as improving R&D efficiency, boosting specific car attributes, or giving you an edge in the market.</p>
                    <p>Examples include <b className="text-blue-400">'Technical Mastermind'</b>, <b className="text-blue-400">'Cost Cap Guru'</b>, or <b className="text-blue-400">'Sponsor Magnet'</b>.</p>
                    <p>Choosing staff with the right traits can be just as important as their core skill ratings.</p>
                </SubSection>
            </Section>

            <Section title="Race Weekend Explained">
                <p>While the races are simulated, your off-season choices have a direct impact.</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    <li><strong>Practice:</strong> Simulates your team preparing for the weekend. A good session provides a small time bonus for qualifying, while a bad one (crashes, reliability issues) gives a penalty.</li>
                    <li><strong>Qualifying:</strong> A three-stage knockout session (Q1, Q2, Q3) to set the starting grid. Your car's pace and driver's qualifying skill are key.</li>
                    <li><strong>Race:</strong> The main event is simulated lap-by-lap. Watch the action unfold in the event log and on the track map. Incidents, weather changes, and strategy calls are all handled by the AI based on your drivers, car, and staff.</li>
                    <li><strong>AI Summary:</strong> After the race, an AI-generated report breaks down the key stories and moments.</li>
                </ul>
            </Section>

             <Section title="Key Concepts">
                <ul className="list-disc list-inside space-y-2 pl-2">
                    <li><b className="text-teal-400">Team Prestige Rating (TPR):</b> A score representing your team's reputation and performance. A higher TPR makes it easier to attract top staff and drivers.</li>
                    <li><b className="text-yellow-400">Driver Stock Value (DSV):</b> A measure of a driver's performance and market appeal. High DSV drivers are in-demand and command high salaries.</li>
                    <li><b className="text-red-400">Market Volatility Index (MVI):</b> Indicates how chaotic the driver market will be. A high MVI means more unexpected transfers and opportunities.</li>
                </ul>
            </Section>
        </div>
      </div>
    </div>
  );
};

export default HowToPlayModal;
