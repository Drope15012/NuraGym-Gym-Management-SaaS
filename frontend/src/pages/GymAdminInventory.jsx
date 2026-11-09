import { useState } from 'react';

const initialInventory = [
  {
    sku: 'WP-1001',
    name: 'Whey Protein',
    stock: 42,
    price: '$39.99'
  },
  {
    sku: 'TS-2042',
    name: 'T-Shirt',
    stock: 18,
    price: '$24.00'
  },
  {
    sku: 'GB-8801',
    name: 'Gym Bottle',
    stock: 30,
    price: '$14.50'
  }
];

export default function GymAdminInventory() {
  const [inventory, setInventory] = useState(initialInventory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsModalOpen(false);
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();

    setInventory((currentInventory) =>
      currentInventory.map((item) =>
        item.sku === editingItem.sku ? { ...item, ...editingItem } : item
      )
    );

    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (sku) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setInventory((currentInventory) => currentInventory.filter((item) => item.sku !== sku));
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  return (
    <div className="workflow-page">
      <header className="page-header">
        <div>
          <span>Gym Admin</span>
          <h1>Inventory</h1>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsModalOpen(true)}>Add Item</button>
      </header>

      <section className="panel">
        <div className="section-heading">
          <h2>Retail stock</h2>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>SKU</th>
              <th>Stock Count</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.sku}>
                <td>{item.name}</td>
                <td>{item.sku}</td>
                <td>{item.stock}</td>
                <td>{item.price}</td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="link-button" onClick={() => handleEditClick(item)}>Edit</button>
                    <button type="button" className="link-button danger" onClick={() => handleDelete(item.sku)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Item</h3>
              <button type="button" className="link-button" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleSubmit}>
              <label>
                Item Name
                <input type="text" placeholder="Enter item name" />
              </label>
              <label>
                SKU
                <input type="text" placeholder="Enter SKU" />
              </label>
              <label>
                Initial Stock
                <input type="number" placeholder="Enter stock count" />
              </label>
              <label>
                Price
                <input type="number" step="0.01" placeholder="Enter price" />
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingItem && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Item</h3>
              <button type="button" className="link-button" onClick={() => setIsEditModalOpen(false)}>Close</button>
            </div>

            <form className="workflow-form" onSubmit={handleEditSubmit}>
              <label>
                Item Name
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(event) => setEditingItem((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                SKU
                <input
                  type="text"
                  value={editingItem.sku}
                  onChange={(event) => setEditingItem((current) => ({ ...current, sku: event.target.value }))}
                />
              </label>
              <label>
                Stock Count
                <input
                  type="number"
                  value={editingItem.stock}
                  onChange={(event) => setEditingItem((current) => ({ ...current, stock: Number(event.target.value) }))}
                />
              </label>
              <label>
                Price
                <input
                  type="text"
                  value={editingItem.price}
                  onChange={(event) => setEditingItem((current) => ({ ...current, price: event.target.value }))}
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
