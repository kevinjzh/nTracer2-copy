import React, { useContext, useEffect, useMemo, useState } from 'react';
import { DashboardContext } from './DashboardReducer'
import Tree from 'rc-tree';

import styled from 'styled-components/macro'
import './tree.css'

export default function TreePanel({ data }) {
    const [dashboardState, dashboardDispatch] = useContext(DashboardContext)

    const [expandedKeys, setExpandedKeys] = useState([])

    const onSelect = (selectedKeys, { nativeEvent }) => {
      if (selectedKeys.length > 1 && !nativeEvent.ctrlKey && !nativeEvent.metaKey) {
        selectedKeys = [selectedKeys[selectedKeys.length - 1]]
      }

      dashboardDispatch({
        type: 'treeSelect',
        payload: {
          selection: (selectedKeys.length > 0) ? selectedKeys : null
        }
      })
    }

    const onExpand = (newExpandedKeys) => {
      dashboardState.selected_indexes.forEach((selected_index) => {
        const requiredKeys = selected_index.slice(0, -1).reduce((prev, curr) => {
          if (prev.length === 0) return [curr.toString()]
          return [...prev, `${prev[prev.length - 1]}-${curr}`]
        }, [])
        requiredKeys.forEach((key) => {
          if (!newExpandedKeys.includes(key)) {
            dashboardDispatch({
              type: 'unselectPoint'
            })
          }
        })
      })
      
      dashboardDispatch({
        type: 'setExpandedNeuron',
        payload: {
          expanded_neuron: (newExpandedKeys.length > 0 && !isNaN(newExpandedKeys[newExpandedKeys.length - 1])) ? parseInt(newExpandedKeys[newExpandedKeys.length - 1]) : -1
        }
      })
      setExpandedKeys(newExpandedKeys);
    }

    const selected = useMemo(() => {
      return dashboardState.selected_indexes.map(selection => selection.join('-'))
    }, [dashboardState])

    useEffect(() => {
      if (dashboardState.selected_point !== null && dashboardState.selected_indexes.length > 0) {
        const newKeys = dashboardState.selected_indexes[0].reduce(
          (prev, curr) => {
            if (prev.length === 0) return [curr.toString()]
            return [...prev, `${prev[prev.length - 1]}-${curr}`]
          },
          []
        )
        setExpandedKeys((ek) => {
          const toAdd = newKeys.filter((key) => !ek.includes(key))
          return [...ek, ...toAdd]
        })
      }
    }, [dashboardState.selected_point])

    const treeData = useMemo(() => {
      const generateTreeData = (nodes) => {
        if (!nodes) return
  
        return nodes['children'].map((node) => {
          return {
            key: node['key'],
            title: node['key'],
            children: generateTreeData(node)
          }
        })
      }
      return generateTreeData(data)
    }, [data])

    return(
        <CustomTree
          key={dashboardState.tree_expand_all ? 1 : 0}
          autoExpandParent={false}
          selectedKeys={selected}
          expandedKeys={expandedKeys}
          onSelect={onSelect}
          onExpand={onExpand}
          treeData={treeData}
          multiple={true}
          defaultExpandAll={dashboardState.tree_expand_all}
        />
    )
}

const CustomTree = styled(Tree)`
  font: 0.6em sans-serif;
  li {
    padding-left: 5px;
  }
`